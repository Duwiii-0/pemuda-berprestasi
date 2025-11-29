import React from 'react';

const BulkGenerateIDCard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bulk Generate ID Card</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dojang" className="block text-sm font-medium text-gray-700">
              Filter by Dojang
            </label>
            <select
              id="dojang"
              name="dojang"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
            >
              <option>All Dojang</option>
              {/* Add dojang options here */}
            </select>
          </div>
          <div>
            <label htmlFor="kelas" className="block text-sm font-medium text-gray-700">
              Filter by Kelas Kejuaraan
            </label>
            <select
              id="kelas"
              name="kelas"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
            >
              <option>All Kelas</option>
              {/* Add kelas options here */}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
            <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
                Print
            </button>
            <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                style={{ backgroundColor: "#990D35" }}
            >
                Download PDF
            </button>
        </div>
      </div>
    </div>
  );
};

export default BulkGenerateIDCard;
