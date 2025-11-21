<?php

namespace App\Services;

use App\Models\Bagan;
use App\Models\Kompetisi;
use App\Models\KelasKejuaraan;
use App\Models\PesertaKompetisi;
use App\Models\DrawingSeed;
use App\Models\Match;
use App\Models\Atlet;
use App\Models\Dojang;
use App\Models\PesertaTim;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

// Participant Interface and BracketParticipant Class (as defined before)
interface Participant
{
    public function getId(): int;
    public function getName(): string;
    public function getDojang(): ?string;
    public function isTeam(): bool;
    public function getAtletId(): ?int;
    public function getTeamMembers(): array;
}

class BracketParticipant implements Participant
{
    private $id;
    private $name;
    private $dojang;
    private $isTeam;
    private $atletId;
    private $teamMembers;

    public function __construct(PesertaKompetisi $pesertaKompetisi)
    {
        $this->id = $pesertaKompetisi->id_peserta_kompetisi;
        $this->isTeam = (bool)$pesertaKompetisi->is_team;

        if ($this->isTeam) {
            if (!$pesertaKompetisi->relationLoaded('anggotaTim')) {
                $pesertaKompetisi->load('anggotaTim.atlet.dojang');
            }
            $this->teamMembers = $pesertaKompetisi->anggotaTim->map(fn($at) => $at->atlet->nama_atlet)->toArray();
            $this->name = 'Tim ' . implode(' & ', $this->teamMembers);
            $this->dojang = $pesertaKompetisi->anggotaTim->first()->atlet->dojang->nama_dojang ?? null;
            $this->atletId = null;
        } else {
            if (!$pesertaKompetisi->relationLoaded('atlet')) {
                $pesertaKompetisi->load('atlet.dojang');
            }
            $this->name = $pesertaKompetisi->atlet->nama_atlet ?? 'N/A';
            $this->dojang = $pesertaKompetisi->atlet->dojang->nama_dojang ?? null;
            $this->atletId = $pesertaKompetisi->atlet->id_atlet ?? null;
            $this->teamMembers = [];
        }
    }
    public function getId(): int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getDojang(): ?string { return $this->dojang; }
    public function isTeam(): bool { return $this->isTeam; }
    public function getAtletId(): ?int { return $this->atletId; }
    public function getTeamMembers(): array { return $this->teamMembers; }

    public static function fromPesertaKompetisi(PesertaKompetisi $peserta): self
    {
        return new self($peserta);
    }
}


class BracketService
{
    public static function createBracket(int $kompetisiId, int $kelasKejuaraanId, ?array $dojangSeparation): array
    {
        $existingBagan = Bagan::where('id_kompetisi', $kompetisiId)
            ->where('id_kelas_kejuaraan', $kelasKejuaraanId)
            ->first();

        if ($existingBagan) {
            throw new \Exception('Bagan sudah dibuat untuk kelas kejuaraan ini');
        }

        return self::generateBracket($kompetisiId, $kelasKejuaraanId, null, $dojangSeparation);
    }

    public static function generateBracket(int $kompetisiId, int $kelasKejuaraanId, ?array $byeParticipantIds, ?array $dojangSeparation): array
    {
        return DB::transaction(function() use ($kompetisiId, $kelasKejuaraanId, $byeParticipantIds, $dojangSeparation) {
            $registrations = PesertaKompetisi::where('id_kelas_kejuaraan', $kelasKejuaraanId)
                ->where('status', 'APPROVED')
                ->with(['atlet.dojang', 'anggotaTim.atlet.dojang', 'kelasKejuaraan.kategoriEvent'])
                ->get();

            if ($registrations->count() < 2) {
                throw new \Exception('Minimal 2 peserta diperlukan untuk membuat bagan');
            }

            $kategori = strtolower($registrations->first()->kelasKejuaraan->kategoriEvent->nama_kategori ?? '');
            $isPemula = str_contains($kategori, 'pemula');
            
            $participants = $registrations->map(fn($reg) => new BracketParticipant($reg))->all();

            $bagan = Bagan::create(['id_kompetisi' => $kompetisiId, 'id_kelas_kejuaraan' => $kelasKejuaraanId]);

            foreach ($participants as $index => $participant) {
                DrawingSeed::create([
                    'id_bagan' => $bagan->id_bagan,
                    'id_peserta_kompetisi' => $participant->getId(),
                    'seed_num' => $index + 1,
                ]);
            }
            
            $matches = $isPemula
                ? self::generatePemulaBracket($bagan->id_bagan, $participants, $dojangSeparation)
                : self::generatePrestasiBracket($bagan->id_bagan, $participants, $byeParticipantIds, $dojangSeparation);
            
            $createdR1Matches = collect($matches)->filter(fn($m) => $m['round'] === 1);
            foreach ($createdR1Matches as $m) {
                if ($m['participant1'] && !($m['participant2'] ?? null) && $m['id']) {
                    self::advanceWinnerToNextRound($bagan->id_bagan, $m, $m['participant1']->getId());
                }
            }

            return ['id' => $bagan->id_bagan, 'matches' => $matches];
        });
    }

    private static function generatePemulaBracket(int $baganId, array $participants, ?array $dojangSeparation): array
    {
        // ... (Full implementation from node service to be ported here)
        return self::simplePairing($baganId, $participants);
    }

    private static function generatePrestasiBracket(int $baganId, array $participants, ?array $byeParticipantIds, ?array $dojangSeparation): array
    {
        // ... (Full implementation from node service to be ported here)
        return self::simplePairing($baganId, $participants);
    }
    
    // A simplified placeholder for pairing logic
    private static function simplePairing(int $baganId, array $participants): array
    {
        $matches = [];
        $shuffled = self::shuffleArray($participants);
        $participantCount = count($shuffled);
        $totalRounds = self::calculateTotalRounds($participantCount);
        $targetSize = pow(2, $totalRounds);
        $byesNeeded = $targetSize - $participantCount;
        
        $round1Matches = [];
        $byeParticipants = array_slice($shuffled, 0, $byesNeeded);
        $activeParticipants = array_slice($shuffled, $byesNeeded);

        for ($i = 0; $i < count($activeParticipants); $i += 2) {
             if (isset($activeParticipants[$i+1])) {
                $round1Matches[] = [$activeParticipants[$i], $activeParticipants[$i+1]];
             } else {
                $byeParticipants[] = $activeParticipants[$i];
             }
        }
        foreach($byeParticipants as $p) {
            $round1Matches[] = [$p, null];
        }

        foreach ($round1Matches as $i => $pair) {
            $p1 = $pair[0];
            $p2 = $pair[1] ?? null;
            $match = Match::create(['id_bagan' => $baganId, 'ronde' => 1, 'position' => $i, 'id_peserta_a' => $p1->getId(), 'id_peserta_b' => $p2 ? $p2->getId() : null]);
            $matches[] = ['id' => $match->id_match, 'round' => 1, 'position' => $i, 'participant1' => $p1, 'participant2' => $p2, 'status' => $p2 ? 'pending' : 'bye'];
        }

        // Create placeholders for subsequent rounds
        for ($round = 2; $round <= $totalRounds; $round++) {
            $matchesInRound = pow(2, $totalRounds - $round);
            for ($i = 0; $i < $matchesInRound; $i++) {
                $match = Match::create(['id_bagan' => $baganId, 'ronde' => $round, 'position' => $i]);
                $matches[] = ['id' => $match->id_match, 'round' => $round, 'position' => $i, 'participant1' => null, 'participant2' => null, 'status' => 'pending'];
            }
        }
        return $matches;
    }

    public static function advanceWinnerToNextRound(int $baganId, array $matchData, int $winnerId): void
    {
        $nextRound = ($matchData['round'] ?? 1) + 1;
        $nextMatchPosition = floor(($matchData['position'] ?? 0) / 2);
        
        $nextMatch = Match::where('id_bagan', $baganId)->where('ronde', $nextRound)->where('position', $nextMatchPosition)->first();

        if ($nextMatch) {
            $isFirstSlot = ($matchData['position'] ?? 0) % 2 === 0;
            $updateField = $isFirstSlot ? 'id_peserta_a' : 'id_peserta_b';
            $nextMatch->update([$updateField => $winnerId]);
        }
    }

    private static function shuffleArray(array $array): array
    {
        $shuffled = $array;
        shuffle($shuffled);
        return $shuffled;
    }

    private static function calculateTotalRounds(int $count): int
    {
      if ($count < 2) return 0;
      return ceil(log($count, 2));
    }
}
