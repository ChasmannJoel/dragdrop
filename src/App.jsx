import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function App() {
  const [results, setResults] = useState([]);
  const [totals, setTotals] = useState({ totalUsers: 0, totalContactsAll: 0 });
  const [dragActive, setDragActive] = useState(false);

  // Normalizar teléfono (para deduplicar)
  const normalizeNumber = (n) => String(n ?? "")
    .trim()
    .replace(/[^\d]/g, ""); // solo dígitos

  const processData = useCallback((rows) => {
    // rows: [{contactName, contactNumber, user}, ...]
    const uniqueByUser = new Set(); // clave: number_user
    const userCount = {};
    const globalNumbers = new Set(); // cuántos números únicos hay en total

    rows.forEach((row) => {
      const user = String(row.user ?? "").trim();
      const number = normalizeNumber(row.contactNumber);

      if (!user || !number) return;

      globalNumbers.add(number);

      const key = `${number}_${user}`;
      if (!uniqueByUser.has(key)) {
        uniqueByUser.add(key);
        userCount[user] = (userCount[user] || 0) + 1;
      }
    });

    const resultArray = Object.entries(userCount)
      .map(([user, contacts]) => ({ user, contacts }))
      .sort((a, b) => b.contacts - a.contacts || a.user.localeCompare(b.user));

    setResults(resultArray);
    setTotals({
      totalUsers: resultArray.length,
      totalContactsAll: globalNumbers.size,
    });
  }, []);

  const parseCSV = (file) =>
    new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          let data = res.data;

          // Si no vienen headers esperados, mapeamos por índice (0,1,2)
          const looksLikeIndexed =
            data.length &&
            !("contactNumber" in data[0]) &&
            !("user" in data[0]) &&
            Array.isArray(res.meta?.fields) &&
            res.meta.fields.length <= 1; // a veces PapaParse pone un único campo

          if (looksLikeIndexed) {
            // Reparsear como filas sin header
            Papa.parse(file, {
              header: false,
              skipEmptyLines: true,
              complete: (res2) => {
                const rows = res2.data.map((r) => ({
                  contactName: r[0],
                  contactNumber: r[1],
                  user: r[2],
                }));
                resolve(rows);
              },
            });
          } else {
            // Usar las claves si existen, si no, por índice
            const rows = data.map((r) => ({
              contactName: r.contactName ?? r[0],
              contactNumber: r.contactNumber ?? r[1],
              user: r.user ?? r[2],
            }));
            resolve(rows);
          }
        },
      });
    });

  const parseXLSX = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // filas por índice
        const rows = json.slice(1).map((row) => ({
          contactName: row[0],
          contactNumber: row[1],
          user: row[2],
        }));
        resolve(rows);
      };
      reader.readAsArrayBuffer(file);
    });

  const handleFile = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    const isCSV = name.endsWith(".csv");
    const isXLSX = name.endsWith(".xlsx") || name.endsWith(".xls");

    if (!isCSV && !isXLSX) {
      alert("Subí un archivo .csv o .xlsx");
      return;
    }

    const rows = isCSV ? await parseCSV(file) : await parseXLSX(file);
    processData(rows);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    await handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const container = {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    minHeight: "100vh",
    padding: 24,
    background: "#f7f7fb",
    boxSizing: "border-box",
  };
  const dropZone = {
    position: "relative",
    border: "3px dashed #3b82f6",
    borderRadius: 20,
    background: dragActive ? "#eef4ff" : "white",
    minHeight: "70vh",
    maxWidth: 900,
    margin: "0 auto",
    padding: 32,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  };
  const title = { fontSize: 28, marginBottom: 12, color: "#111827" };
  const hint = { fontSize: 16, marginBottom: 20, color: "#374151" };
  const inputBtn = {
    fontSize: 16,
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
  };
  const totalsBar = {
    display: "flex",
    gap: 16,
    marginTop: 24,
    flexWrap: "wrap",
    justifyContent: "center",
  };
  const chip = {
    padding: "10px 14px",
    borderRadius: 999,
    background: "#e5e7eb",
    fontWeight: 600,
  };
  const tableWrap = { width: "100%", overflowX: "auto", marginTop: 24 };
  const table = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 16,
    background: "white",
  };
  const th = {
    border: "1px solid #e5e7eb",
    padding: 12,
    background: "#3b82f6",
    color: "black",
    textAlign: "left",
    fontSize: 18,
  };
  const td = { border: "1px solid #e5e7eb", padding: 12, color: "black" };

  return (
    <div style={container}>
      <div
        style={dropZone}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <h1 style={title}>Soltá aquí tu archivo CSV o XLSX</h1>
        <p style={hint}>
          También podés elegirlo manualmente...
        </p>
        <label style={inputBtn}>
          Elegir archivo
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {results.length > 0 && (
          <>
            <div style={totalsBar}>
              <span style={chip}>Usuarios: {totals.totalUsers}</span>
              <span style={chip}>
                Números únicos (global): {totals.totalContactsAll}
              </span>
            </div>

            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Usuario</th>
                    <th style={th}>Contactos únicos</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.user}>
                      <td style={td}><strong>{r.user}</strong></td>
                      <td style={td}>{r.contacts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

