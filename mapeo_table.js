const robot = require('@hurdlegroup/robotjs');
const notifier = require('node-notifier');
const fs = require('fs');
const pl = require('tau-prolog');
require('tau-prolog/modules/js');

let session = pl.create();
let coordenadas = [];
let posicionesMap = {}; // Almacenar las posiciones cargadas del archivo .txt
const prologFilePath = './coordenadas.pl';
const posicionesFilePath = './posiciones.txt'; // Archivo de posiciones
let posicionesDisparadas = [];
let primerAtaqueRealizado = false;

const startX = 685;
const posY = 92;

const thresholdStarted = 29;
const threshouldStartOpponent = 37;
const thresholdYourTurn = 11;
const thresholdOpponentTurn = 30;

// Cargar el archivo de posiciones .txt
function cargarPosiciones() {
    fs.readFile(posicionesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error al leer el archivo de posiciones:", err);
            return;
        }

        const lineas = data.split('\n');
        lineas.forEach(linea => {
            const match = linea.match(/([A-Z]\d+)\s+\(X:\s*(\d+),\s*Y:\s*(\d+)\)/);
            if (match) {
                const nombre = match[1];
                const x = parseInt(match[2], 10);
                const y = parseInt(match[3], 10);
                posicionesMap[nombre] = { x, y };
            }
        });
        console.log("Posiciones cargadas desde el archivo de texto:", posicionesMap);
        cargarArchivoProlog();
    });
}

// Cargar el archivo Prolog
function cargarArchivoProlog() {
    fs.readFile(prologFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error al leer el archivo Prolog:", err);
            return;
        }

        session.consult(data, {
            success: () => {
                console.log("Archivo Prolog cargado exitosamente.");
                obtenerTodasCoordenadas(); // Llama a obtener todas las coordenadas
            },
            error: (err) => console.error("Error al cargar el archivo Prolog:", err)
        });
    });
}

// Obtener todas las coordenadas de Prolog
function obtenerTodasCoordenadas() {
    console.log("Consultando coordenadas...");
    session.query("coordenadas(Nombre).", {
        success: function() {
            processNext(); // Llama a la función para procesar las respuestas
        },
        fail: function() {
            console.error("Error al consultar coordenadas en Prolog.");
        }
    });
}

// Procesar cada respuesta
function processNext() {
    session.answer({
        success: function(answer) {
            let result = pl.format_answer(answer);
            console.log("Respuesta Prolog:", result); // Ver la respuesta

            let match = result.match(/Nombre = (\w+)/);
            
            if (match) {
                let nombre = match[1];
                if (posicionesMap[nombre]) {
                    let { x, y } = posicionesMap[nombre];
                    console.log(`Agregando coordenada: ${nombre}, X: ${x}, Y: ${y}`);
                    coordenadas.push({ nombre, x, y });
                } else {
                    console.log(`Posición ${nombre} no encontrada en el archivo de texto.`);
                }

                // Llamar a processNext de nuevo para la siguiente respuesta
                processNext();
            } else {
                console.log("Coordenadas obtenidas:", coordenadas);
                iniciar(); // Iniciar el flujo del programa
            }
        },
        fail: function() {
            console.log("No hay más coordenadas.");
            console.log("Coordenadas obtenidas:", coordenadas);
            iniciar(); // Iniciar el flujo del programa
        }
    });
}

// Mover y hacer clic
function moverYClick(posicion) {
    if (!posicionesDisparadas.some(p => p.x === posicion.x && p.y === posicion.y)) {
        console.log(`Moviendo mouse a X: ${posicion.x}, Y: ${posicion.y}`);
        robot.moveMouse(posicion.x, posicion.y);
        
        setTimeout(() => {
            console.log("Haciendo clic en la posición.");
            robot.mouseClick();
            posicionesDisparadas.push(posicion);
            console.log(`Posición disparada registrada: X=${posicion.x}, Y=${posicion.y}`);
        }, 1000);
    } else {
        console.log(`Ya se disparó a la posición: X=${posicion.x}, Y=${posicion.y}`);
    }
}

function detectarMensaje() {
    let sameColorPixels = 0;

    for (let x = startX; x < startX + 350; x++) {
        let currentColor = robot.getPixelColor(x, posY);
        
        if (currentColor === '000000') {
            sameColorPixels++;
        } else if (currentColor === '7f170e') {
            console.log("Se termina la ejecución, el jugador ha abandonado");
            notifier.notify({ title: 'Notificación', message: 'El jugador ha abandonado. Se termina la ejecución.', sound: true });
            process.exit(0);
        } else if (currentColor === 'ea3323') {
            console.log("Se termina la ejecución, has perdido.");
            notifier.notify({ title: 'Notificación', message: 'Juego Finalizado. Has perdido.', sound: true });
            process.exit(0);
        } else if (currentColor === '377e22') {
            console.log("Se termina la ejecución, has ganado.");
            notifier.notify({ title: 'Notificación', message: 'Juego Finalizado. Has ganado.', sound: true });
            process.exit(0);
        }
    }

    let estado = "No message detected";

    if (sameColorPixels == thresholdStarted || sameColorPixels == thresholdYourTurn) {
        estado = "Ataque";  
    } else if (sameColorPixels == thresholdOpponentTurn || sameColorPixels == threshouldStartOpponent) {
        estado = "Espera";  
    }

    console.log(`Estado actual: ${estado}`);
    return estado; 
}

// Disparar la siguiente coordenada
function dispararSiguienteCoordenada() {
    let siguientePosicion;

    if (!primerAtaqueRealizado) {
        siguientePosicion = coordenadas[0]; 
        primerAtaqueRealizado = true; 
        console.log("Primer ataque a:", siguientePosicion.nombre);
    } else {
        siguientePosicion = coordenadas.find(c => 
            !posicionesDisparadas.some(p => p.x === c.x && p.y === c.y)
        );
        console.log("Buscando siguiente posición no disparada...");
    }

    if (siguientePosicion) {
        console.log(`Disparando a la coordenada: ${siguientePosicion.nombre} - X=${siguientePosicion.x}, Y=${siguientePosicion.y}`);
        moverYClick({ x: siguientePosicion.x, y: siguientePosicion.y });
    } else {
        console.log("Ya se disparó a todas las coordenadas disponibles.");
    }
}

// Iniciar el proceso
function iniciar() {
    console.log('Esperando 3 segundos antes de comenzar a verificar mensajes...');
    setTimeout(() => {
        const interval = setInterval(() => {
            let estado = detectarMensaje();

            console.log(`Estado: ${estado}`); 

            if (estado === "Ataque") {
                dispararSiguienteCoordenada();
            } else {
                console.log("Esperando a que sea tu turno para disparar...");
            }
        }, 3000); 
    }, 3000); 
}

// Cargar posiciones y empezar
cargarPosiciones();
