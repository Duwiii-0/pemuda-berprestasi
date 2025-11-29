# Testing Guide: Dojang Certificate Feature

## 🎯 Quick Test Plan

### Test 1: Dojang dengan Peserta APPROVED ✅

**Scenario:** Dojang memiliki minimal 1 atlet dengan peserta_kompetisi status = APPROVED

**Steps:**
1. Login sebagai Pelatih
2. Navigate ke `/dashboard/dataDojang`
3. Wait for page load

**Expected Result:**
- Console log: `✅ Found APPROVED participants. Certificate button will be enabled.`
- Button text: "Download Sertifikat Partisipasi Kejuaraan"
- Button: **Enabled** (kuning gradient, clickable)
- Button style: `bg-gradient-to-r from-yellow-600 to-yellow-500`

**Test Action:**
- Click button → PDF certificate should download

---

### Test 2: Dojang TANPA Peserta APPROVED ❌

**Scenario:** Dojang tidak memiliki atlet dengan status APPROVED

**Steps:**
1. Login sebagai Pelatih (dojang baru atau belum ada approved)
2. Navigate ke `/dashboard/dataDojang`
3. Wait for page load

**Expected Result:**
- Console log: `ℹ️ No APPROVED participants found. Certificate button will be disabled.`
- Button text: "Belum Ada Peserta"
- Button: **Disabled** (gray, not clickable)
- Button style: `bg-gray-200 text-gray-400`

**Test Action:**
- Click button → Nothing happens (disabled state)

---

### Test 3: Loading State ⏳

**Scenario:** Network slow atau sedang fetch data

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Navigate ke `/dashboard/dataDojang`
4. Observe button during loading

**Expected Result:**
- Button text: "Checking..."
- Button: **Disabled** (tidak bisa di-klik)
- State: `checkingParticipants = true`

---

### Test 4: Admin View 👔

**Scenario:** User dengan role ADMIN mengakses halaman

**Steps:**
1. Login sebagai ADMIN
2. Navigate ke `/dashboard/dataDojang`

**Expected Result:**
- Button certificate: **TIDAK MUNCUL** (admin tidak punya dojang sendiri)
- Hanya button "Ubah Data Dojang" yang muncul (jika ada permission)

---

### Test 5: API Endpoint Testing (Backend) 🔧

**Test 5.1: Success - Has Approved**
```bash
# Login first to get token
curl -X POST https://cjvmanagementevent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pelatih_user","password":"password"}'

# Save token, then:
curl -X GET https://cjvmanagementevent.com/api/dojang/1/has-approved-participants \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: { "hasApproved": true }
```

**Test 5.2: Success - No Approved**
```bash
curl -X GET https://cjvmanagementevent.com/api/dojang/2/has-approved-participants \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: { "hasApproved": false }
```

**Test 5.3: Error - Unauthorized**
```bash
curl -X GET https://cjvmanagementevent.com/api/dojang/1/has-approved-participants

# Expected: 401 Unauthorized
```

**Test 5.4: Error - Not Found**
```bash
curl -X GET https://cjvmanagementevent.com/api/dojang/99999/has-approved-participants \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 404 Not Found (if dojang doesn't exist)
```

---

## 🔍 Database Verification

### Check Approved Participants Count

```sql
-- Check specific dojang
SELECT 
  d.id_dojang,
  d.nama_dojang,
  COUNT(DISTINCT pk.id_peserta_kompetisi) as total_peserta,
  COUNT(DISTINCT CASE WHEN pk.status = 'APPROVED' THEN pk.id_peserta_kompetisi END) as approved_count,
  COUNT(DISTINCT CASE WHEN pk.status = 'PENDING' THEN pk.id_peserta_kompetisi END) as pending_count
FROM tb_dojang d
LEFT JOIN tb_atlet a ON a.id_dojang = d.id_dojang
LEFT JOIN tb_peserta_kompetisi pk ON pk.id_atlet = a.id_atlet
WHERE d.id_dojang = 1 -- Change to your dojang ID
GROUP BY d.id_dojang, d.nama_dojang;
```

### List All Dojang with Approved Status

```sql
SELECT 
  d.id_dojang,
  d.nama_dojang,
  d.provinsi,
  COUNT(DISTINCT CASE WHEN pk.status = 'APPROVED' THEN pk.id_peserta_kompetisi END) as approved_count
FROM tb_dojang d
LEFT JOIN tb_atlet a ON a.id_dojang = d.id_dojang
LEFT JOIN tb_peserta_kompetisi pk ON pk.id_atlet = a.id_atlet
GROUP BY d.id_dojang, d.nama_dojang, d.provinsi
ORDER BY approved_count DESC;
```

### Manual Update for Testing

```sql
-- Approve a participant for testing
UPDATE tb_peserta_kompetisi 
SET status = 'APPROVED' 
WHERE id_peserta_kompetisi = 1;

-- Revert to pending
UPDATE tb_peserta_kompetisi 
SET status = 'PENDING' 
WHERE id_peserta_kompetisi = 1;
```

---

## 🐛 Debugging Checklist

### Frontend Issues

**Problem: Button tidak muncul**
- [ ] Check user role (Admin tidak akan lihat button)
- [ ] Check `isEditing` state (button hidden saat edit mode)
- [ ] Check browser console for errors

**Problem: Button selalu disabled**
- [ ] Check console log: `hasApprovedParticipants: false`
- [ ] Verify database memiliki approved participants
- [ ] Check API response di Network tab
- [ ] Try manual API call (Postman/curl)

**Problem: Button selalu enabled**
- [ ] Check `hasApprovedParticipants` state
- [ ] Check if API call failed (using fallback)
- [ ] Verify endpoint URL correct

**Problem: Button stuck on "Checking..."**
- [ ] Check `checkingParticipants` state
- [ ] API call timeout or error
- [ ] Check network tab for failed request

### Backend Issues

**Problem: Endpoint returns 401**
- [ ] Check JWT token in Authorization header
- [ ] Token expired? Re-login
- [ ] `authenticate` middleware applied?

**Problem: Endpoint returns wrong count**
- [ ] Check database query
- [ ] Verify `status` field enum values
- [ ] Check foreign key relations (atlet → dojang)

**Problem: Endpoint slow**
- [ ] Check database indexes
- [ ] Monitor query execution time
- [ ] Consider adding database index on `status` field

---

## 📊 Console Log Reference

### Expected Logs (Success Path)

```
🔄 Fetching dojang data...
📋 Raw API Response: {data: {...}}
📊 Dojang data: {id_dojang: 1, nama_dojang: "..."}
✅ Valid dojang data: Dojang XYZ
🔎 Checking approved participants for dojang: 1
📋 Approved participants check response: {hasApproved: true}
🎯 Final result - hasApprovedParticipants: true for dojang 1
✅ Found APPROVED participants. Certificate button will be enabled.
```

### Expected Logs (No Approved Path)

```
🔄 Fetching dojang data...
✅ Valid dojang data: Dojang ABC
🔎 Checking approved participants for dojang: 2
📋 Approved participants check response: {hasApproved: false}
🎯 Final result - hasApprovedParticipants: false for dojang 2
ℹ️ No APPROVED participants found. Certificate button will be disabled.
```

### Expected Logs (Error + Fallback Path)

```
🔎 Checking approved participants for dojang: 3
❌ Error checking approved participants: Network error
🔄 Trying fallback method with atlet endpoint...
📋 Raw atlet response: [...]
👥 Found 5 athletes for dojang 3
🎯 Fallback result - hasApprovedParticipants: true
```

---

## ⚡ Performance Benchmarks

### Expected Response Times

| Endpoint | Method | Expected Time | Notes |
|----------|--------|---------------|-------|
| `/dojang/:id/has-approved-participants` | Primary | 10-50ms | COUNT query only |
| `/atlet/by-dojang/:id` | Fallback | 100-500ms | SELECT with includes |
| Full page load | - | 500-1000ms | Including all requests |

### Performance Test

```javascript
// Run in browser console
console.time('Approved Check');
fetch('/api/dojang/1/has-approved-participants', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
})
  .then(r => r.json())
  .then(data => {
    console.timeEnd('Approved Check');
    console.log('Result:', data);
  });
```

---

## 📝 Test Scenarios Matrix

| Scenario | Approved Count | Button State | Button Text | Clickable |
|----------|----------------|--------------|-------------|-----------|
| New Dojang | 0 | Disabled | "Belum Ada Peserta" | ❌ |
| Has 1 Approved | 1+ | Enabled | "Download Sertifikat..." | ✅ |
| All Pending | 0 | Disabled | "Belum Ada Peserta" | ❌ |
| Loading | ? | Disabled | "Checking..." | ❌ |
| Admin User | N/A | Hidden | - | - |
| Edit Mode | N/A | Hidden | - | - |

---

## 🚀 Quick Commands

### Start Backend (Development)
```bash
cd pemuda-berprestasi-mvp
npm run dev
```

### Start Frontend (Development)
```bash
cd pemuda-berprestasi
npm run dev
```

### Check Backend Logs
```bash
# Linux/Mac
tail -f pemuda-berprestasi-mvp/logs/app.log

# Windows
Get-Content pemuda-berprestasi-mvp\logs\app.log -Wait
```

### Database Query (Development)
```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

---

## ✅ Final Checklist

Before marking feature as complete:

- [ ] All 5 test scenarios passed
- [ ] API endpoint tested manually
- [ ] Database queries verified
- [ ] Console logs clean (no errors)
- [ ] Button states correct
- [ ] PDF generation works
- [ ] Performance acceptable (<1s page load)
- [ ] Works on mobile view
- [ ] Works on desktop view
- [ ] Admin view handled correctly
- [ ] Error handling tested
- [ ] Fallback method works

---

## 📞 Troubleshooting

### Issue: "Cannot read property 'hasApproved' of undefined"
**Solution:** Check API response format. Add null checks.

### Issue: Button always shows "Checking..."
**Solution:** Check `setCheckingParticipants(false)` in finally block.

### Issue: TypeScript errors in console
**Solution:** Add proper interfaces (cosmetic issue, doesn't affect functionality).

### Issue: 401 Unauthorized
**Solution:** Check token expiry, re-login if needed.

### Issue: Wrong count displayed
**Solution:** Verify database status values, check enum definition.

---

**Happy Testing! 🎉**
