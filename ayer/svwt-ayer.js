import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const app = express();
app.use(cors());
const PORT = 3040;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'reporte_paneles_ayer.json');

app.use(express.json());

// Endpoint para recibir datos del panel
app.post('/ayer', (req, res) => {
	const { panel, contactos_unicos } = req.body;
	console.log('Datos recibidos:', req.body);
	if (!panel || typeof contactos_unicos !== 'number') {
		return res.status(400).json({ error: 'Datos inválidos. Debe incluir panel y contactos_unicos (número).' });
	}

	// Leer datos existentes
	let data = [];
	if (fs.existsSync(DATA_FILE)) {
		try {
			data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
		} catch (e) {
			data = [];
		}
	}

	// Buscar si el panel ya existe
	const idx = data.findIndex(item => item.panel === panel);
	const nuevoRegistro = {
		panel,
		total_mensajes_hoy: contactos_unicos,
		detalle_por_origen: ["whaticket"]
	};
	if (idx !== -1) {
		// Mantener los otros campos si existen, pero actualizar los que vienen de este endpoint
		data[idx] = {
			...data[idx],
			panel: nuevoRegistro.panel,
			total_mensajes_hoy: nuevoRegistro.total_mensajes_hoy,
			detalle_por_origen: nuevoRegistro.detalle_por_origen
		};
		console.log('Registro actualizado:', data[idx]);
	} else {
		data.push(nuevoRegistro);
		console.log('Registro guardado:', nuevoRegistro);
	}

		// Guardar en el archivo
		try {
			fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
			console.log('Archivo guardado correctamente en:', DATA_FILE);
		} catch (err) {
			console.error('Error al escribir el archivo JSON:', err);
			return res.status(500).json({ error: 'Error al guardar el archivo JSON', details: err.message });
		}

		res.json({ success: true });
});

app.listen(PORT, () => {
	console.log(`Servidor escuchando en el puerto ${PORT}`);
});
