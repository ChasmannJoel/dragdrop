
import React, { useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function App() {
  // Enviar datos al endpoint /api/ayer
  const sendToAyer = () => {
    if (!results.length) return;
    let sent = [];
    Promise.all(
      results.map((item) =>
        fetch("/ayer", {
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
              sent.push(`Enviado a ayer: ${item.user} (${item.contacts})`);
            } else {
              sent.push(`Error al enviar a ayer: ${item.user}`);
            }
          })
          .catch((error) => {
            sent.push(`Fallo de red al enviar a ayer: ${item.user}`);
          })
      )
    ).then(() => {
      setLastSent(sent.join("\n"));
    });
  };
  const [results, setResults] = useState([]);
  const [totals, setTotals] = useState({ totalUsers: 0, totalContactsAll: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [lastSent, setLastSent] = useState(null);

    // Normalizar teléfono (para deduplicar)
    const normalizeNumber = (n) => String(n ?? "")
      .trim()
      .replace(/[^\d]/g, ""); // solo dígitos

    const processData = (rows) => {
      const uniqueByUser = new Set();
      const userCount = {};
      const globalNumbers = new Set();
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
      setLastSent(null);
    };

    const handleFile = async (file) => {
      if (!file) return;
      const name = file.name.toLowerCase();
      const isCSV = name.endsWith(".csv");
      const isXLSX = name.endsWith(".xlsx") || name.endsWith(".xls");
      if (!isCSV && !isXLSX) {
        alert("Subí un archivo .csv o .xlsx");
        return;
      }
      let rows = [];
      if (isCSV) {
        await new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (res) => {
              let data = res.data;
              const looksLikeIndexed =
                data.length &&
                !("contactNumber" in data[0]) &&
                !("user" in data[0]) &&
                Array.isArray(res.meta?.fields) &&
                res.meta.fields.length <= 1;
              if (looksLikeIndexed) {
                Papa.parse(file, {
                  header: false,
                  skipEmptyLines: true,
                  complete: (res2) => {
                    rows = res2.data.map((r) => ({
                      contactName: r[0],
                      contactNumber: r[1],
                      user: r[2],
                    }));
                    resolve();
                  },
                });
              } else {
                rows = data.map((r) => ({
                  contactName: r.contactName ?? r[0],
                  contactNumber: r.contactNumber ?? r[1],
                  user: r.user ?? r[2],
                }));
                resolve();
              }
            },
          });
        });
      } else {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            rows = json.slice(1).map((row) => ({
              contactName: row[0],
              contactNumber: row[1],
              user: row[2],
            }));
            resolve();
          };
          reader.readAsArrayBuffer(file);
        });
      }
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
      transition: "background 0.2s",
      padding: 40,
      textAlign: "center",
      marginTop: 40,
      marginBottom: 24,
      cursor: "pointer",
    };
    const title = {
      fontSize: 32,
      fontWeight: 700,
      color: "#2563eb",
      marginBottom: 8,
    };
    const hint = {
      fontSize: 18,
      color: "#64748b",
      marginBottom: 24,
    };
    const inputBtn = {
      display: "inline-block",
      background: "#2563eb",
      color: "white",
      fontWeight: 600,
      padding: "12px 24px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 18,
      marginBottom: 16,
    };
    const totalsBar = {
      display: "flex",
      gap: 16,
      marginBottom: 16,
      marginTop: 16,
    };
    const chip = {
      background: "#e0e7ff",
      color: "#1e293b",
      borderRadius: 8,
      padding: "8px 16px",
      fontWeight: 600,
      fontSize: 16,
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
          <div style={{ height: 32 }} />

          {results.length > 0 && (
            <>
              <button
                style={{marginBottom: 24, padding: "12px 32px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 18, cursor: "pointer"}}
                onClick={() => {
                  let sent = [];
                  const url = "/api/panel";
                  Promise.all(
                    results.map((item) =>
                      fetch(url, {
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
                            sent.push(`Enviado: ${item.user} (${item.contacts})`);
                          } else {
                            sent.push(`Error al enviar: ${item.user}`);
                          }
                        })
                        .catch((error) => {
                          sent.push(`Fallo de red al enviar: ${item.user}`);
                        })
                    )
                  ).then(() => {
                    setLastSent(sent.join("\n"));
                    console.log("Éxito: Datos enviados a", url);
                  });
                }}
              >
                Enviar datos al servidor
              </button>
              <button
                style={{marginBottom: 24, marginLeft: 16, padding: "12px 32px", background: "#facc15", color: "black", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 18, cursor: "pointer"}}
                onClick={sendToAyer}
              >
                Enviar datos a ayer
              </button>
              {lastSent && (
                <pre style={{marginTop: 16, background: "#f3f4f6", padding: 12, borderRadius: 6, fontSize: 14, color: "#111827"}}>{lastSent}</pre>
              )}
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


