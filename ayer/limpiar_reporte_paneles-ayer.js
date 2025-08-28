
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';


// Obtener la ruta absoluta correctamente en Windows
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/+([A-Za-z]:)/, '$1'));
const filePath = path.join(__dirname, 'reporte_paneles_ayer.json');

// Función para limpiar el reporte
async function limpiarReportes() {
	const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
	try {
		fs.writeFileSync(filePath, '[]');
		console.log(`[${fecha}] reporte_paneles_ayer.json limpiado a array vacío []`);
		fs.appendFileSync(path.join(__dirname, 'limpiar_reporte_paneles.log'), `[${fecha}] Limpieza exitosa\n`);
	} catch (err) {
		console.error(`[${fecha}] Error al limpiar reporte_paneles.json:`, err);
		fs.appendFileSync(path.join(__dirname, 'limpiar_reporte_paneles.log'), `[${fecha}] Error: ${err.message}\n`);
	}
}

// Programar para todos los días a las 13:15 hora de Argentina
cron.schedule('0 0 * * *', () => {
	const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
	console.log(`[${fecha}] Tarea programada ejecutada a las 00:00 (Argentina)`);
	fs.appendFileSync(path.join(__dirname, 'limpiar_reporte_paneles.log'), `[${fecha}] Tarea programada ejecutada\n`);
	limpiarReportes();
});

// Ejecutar manualmente si se llama directamente
if (process.argv[1] === new URL(import.meta.url).pathname.replace(/^\/+([A-Za-z]:)/, '$1')) {
	limpiarReportes();
}
