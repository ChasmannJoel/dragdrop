import React, { useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function ContactCounter() {
  const [results, setResults] = useState([]);

  const handleFile = (file) => {
    const reader = new FileReader();

    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        complete: (res) => processData(res.data),
      });
    } else {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const rows = json.slice(1).map((row) => ({
          contactName: row[0],
          contactNumber: row[1],
          user: row[2],
        }));

        processData(rows);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processData = (rows) => {
    const uniqueContacts = new Set();
    const userCount = {};

    rows.forEach((row) => {
      if (!row.contactNumber || !row.user) return;

      const key = `${row.contactNumber}_${row.user}`;
      if (!uniqueContacts.has(key)) {
        uniqueContacts.add(key);
        userCount[row.user] = (userCount[row.user] || 0) + 1;
      }
    });

    const resultArray = Object.entries(userCount).map(([user, count]) => ({
      user,
      contacts: count,
    }));

    setResults(resultArray);

    // Enviar los datos al servidor por cada usuario
    resultArray.forEach((item) => {
      fetch("http://168.231.70.228:3030/panel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          panel: item.user,
          contactos_unicos: item.contacts,
        }),
      })
        .then((response) => {
          if (response.ok) {
            console.log(`Enviado: ${item.user} (${item.contacts})`);
          } else {
            console.error(`Error al enviar: ${item.user}`);
          }
        })
        .catch((error) => {
          console.error(`Fallo de red al enviar: ${item.user}`, error);
        });
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-4 border-dashed border-blue-500 p-20 text-center rounded-2xl bg-gray-50 w-3/4 mx-auto mt-10"
    >
      <p className="text-2xl text-gray-700 font-bold mb-6">
        Arrastrá y soltá un CSV o XLSX aquí
      </p>

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-lg border border-gray-400 mx-auto shadow-lg">
            <thead>
              <tr className="bg-blue-400 text-white text-xl">
                <th className="border p-4">Usuario</th>
                <th className="border p-4">Contactos únicos</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.user} className="text-center">
                  <td className="border p-4 font-semibold">{r.user}</td>
                  <td className="border p-4">{r.contacts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
