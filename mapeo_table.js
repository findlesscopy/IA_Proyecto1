const robot = require('@hurdlegroup/robotjs');
const notifier = require('node-notifier');
const fs = require('fs');
const pl = require('tau-prolog');
require('tau-prolog/modules/js');

let session = pl.create();
let coordenadas = [];
let posicionesMap = {};
const prologFilePath = './coordenadas.pl';
const posicionesFilePath = './posiciones.txt';
let posicionesDisparadas = [];
let barcosDisponibles = {
    1: 4, // 4 barcos de 1 celda
    2: 3, // 3 barcos de 2 celdas
    3: 2, // 2 barcos de 3 celdas
    4: 1  // 1 barco de 4 celdas
};
let is_target = false;

const startX = 685;
const posY = 92;

const thresholdStarted = 29;
const threshouldStartOpponent = 37;
const thresholdYourTurn = 11;
const thresholdOpponentTurn = 30;

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
        console.log("Posiciones cargadas:", posicionesMap);
        cargarArchivoProlog();
    });
}

function cargarArchivoProlog() {
    fs.readFile(prologFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error al leer el archivo Prolog:", err);
            return;
        }
        session.consult(data, {
            success: () => {
                console.log("Archivo Prolog cargado.");
                obtenerTodasCoordenadas();
            },
            error: (err) => console.error("Error al cargar Prolog:", err)
        });
    });
}

function obtenerTodasCoordenadas() {
    session.query("primer_haunting(Nombre).", {
        success: function() {
            processNext('primer_haunting');
        },
        fail: function() {
            console.error("Error al consultar coordenadas en Prolog.");
        }
    });
}

function processNext(haunting) {
    session.answer({
        success: function(answer) {
            let result = pl.format_answer(answer);
            let match = result.match(/Nombre = (\w+)/);
            if (match) {
                let nombre = match[1];
                if (posicionesMap[nombre]) {
                    coordenadas.push({ nombre, ...posicionesMap[nombre] });
                }
                processNext(haunting);
            } else {
                if (haunting === 'primer_haunting') {
                    session.query("segundo_haunting(Nombre).", {
                        success: function() {
                            processNext('segundo_haunting');
                        },
                        fail: function() {
                            console.error("Error en segundo_haunting.");
                        }
                    });
                } else {
                    iniciar();
                }
            }
        },
        fail: function() {
            if (haunting === 'primer_haunting') {
                session.query("segundo_haunting(Nombre).", {
                    success: function() {
                        processNext('segundo_haunting');
                    },
                    fail: function() {
                        console.error("Error en segundo_haunting.");
                    }
                });
            } else {
                iniciar();
            }
        }
    });
}

function moverYClick(posicion) {
    if (!posicionesDisparadas.some(p => p.x === posicion.x && p.y === posicion.y)) {
        robot.moveMouse(posicion.x, posicion.y);
        setTimeout(() => {
            robot.mouseClick();
            posicionesDisparadas.push(posicion);
        }, 1000);
    }
}

function obtenerCeldasAdyacentes(posicion) {
    const celdasAdyacentes = [];
    const letras = 'ABCDEFGHIJ';
    const fila = parseInt(posicion.nombre.slice(1)) - 1;
    const columna = letras.indexOf(posicion.nombre.charAt(0));

    const direcciones = [
        { dx: -1, dy: 0 }, // Arriba
        { dx: 1, dy: 0 },  // Abajo
        { dx: 0, dy: -1 }, // Izquierda
        { dx: 0, dy: 1 }   // Derecha
    ];

    direcciones.forEach(direccion => {
        const nuevaFila = fila + direccion.dx;
        const nuevaColumna = columna + direccion.dy;

        if (nuevaFila >= 0 && nuevaFila < 10 && nuevaColumna >= 0 && nuevaColumna < 10) {
            const nuevaPosicionNombre = letras[nuevaColumna] + (nuevaFila + 1);
            const coordenada = posicionesMap[nuevaPosicionNombre];
            if (coordenada) {
                celdasAdyacentes.push({
                    nombre: nuevaPosicionNombre,
                    x: coordenada.x,
                    y: coordenada.y
                });
            }
        }
    });

    return celdasAdyacentes;
}

// Función para actualizar los barcos disponibles
function actualizarContadorBarcos(tamano) {
    if (barcosDisponibles[tamano] > 0) {
        barcosDisponibles[tamano]--;
        console.log(`Barco de tamaño ${tamano} destruido. Barcos restantes:, barcosDisponibles`);
        // Crea el mensaje para la notificación
        const mensajeNotificacion = `Barco de tamaño ${tamano} destruido. Barcos restantes: ${JSON.stringify(barcosDisponibles)}`;

        notifier.notify({ title: 'Notificación', message: mensajeNotificacion, sound: true });
    }
}

function manejarObjetivo() {
    const ultimaPosicionDisparada = posicionesDisparadas[posicionesDisparadas.length - 1];
    if (ultimaPosicionDisparada) {
        const celdasAdyacentes = obtenerCeldasAdyacentes(ultimaPosicionDisparada);
        const disparoExitoso = dispararACeldasAdyacentes(celdasAdyacentes);

        // Contar cuántas celdas adyacentes se pueden disparar
        const adyacentesDisparables = celdasAdyacentes.filter(celda => obtenerColorDeCelda(celda.x, celda.y) === 'ffffff');

        if (adyacentesDisparables.length === 0) {
            // Si no se disparó a ninguna celda adyacente, se identifica un barco de 1 celda
            console.log("Identificado barco de 1 celda.");
            actualizarContadorBarcos(1);
            dispararSiguienteCoordenada();
        } else {
            // Si hay adyacentes disparables, entonces es un barco más grande
            console.log("Identificado barco de mayor tamaño.");
            // Aquí puedes agregar lógica para identificar si es un barco de 2, 3 o 4 celdas.
            // Esto depende de cuántas adyacentes disparables encuentres.
            // Por simplicidad, aquí se asume que hay un barco de al menos 2 celdas.
            actualizarContadorBarcos(2); // Esto es un ejemplo, ajusta según tu lógica
        }
    }
}

// Función para obtener el color de una celda
function obtenerColorDeCelda(x, y) {
    robot.moveMouse(x, y);
    const color = robot.getPixelColor(x, y);
    console.log(`Color en (${x}, ${y}): #${color}`); // Para depuración
    return color;
}

// Modifica la función dispararACeldasAdyacentes para que retorne un booleano
function dispararACeldasAdyacentes(celdas) {
    for (const celda of celdas) {
        const color = obtenerColorDeCelda(celda.x, celda.y);
        if (color === 'ffffff' || color === 'f7fcf6') {
            console.log(`Disparando a la celda: ${celda.nombre}`);
            moverYClick(celda);
            return true; // Indica que se disparó exitosamente
        } else if (color === 'f2f4f8') {
            console.log(`Celda ${celda.nombre} ya fue disparada.`);
        } else {
            console.log(`Celda ${celda.nombre} no es disparable.`);
        }
    }
    console.log("Todas las celdas adyacentes ya han sido disparadas o no son válidas.");
    return false; // Indica que no se disparó a ninguna celda
}

function dispararSiguienteCoordenada() {
    let siguientePosicion = coordenadas.find(c => 
        !posicionesDisparadas.some(p => p.x === c.x && p.y === c.y)
    );

    if (siguientePosicion) {
        moverYClick(siguientePosicion);
    } else {
        console.log("Ya se disparó a todas las coordenadas disponibles.");
    }
}

function iniciar() {
    const estado = detectarMensaje();

    if (estado === "Ataque") {
        if (is_target) {
            manejarObjetivo();
        } else {
            dispararSiguienteCoordenada();
        }
        is_target = true;
    } else {
        is_target = false;
    }

    setTimeout(iniciar, 2000);
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

cargarPosiciones();