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

let contadorBarco = 0; // Nuevo contador para el tamaño del barco
let pendientesAdyacentes = []; // Pila para almacenar las adyacentes pendientes

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

// Función modificada para manejar las adyacentes y contar el tamaño del barco
function manejarObjetivo() {
    let ultimaPosicionDisparada = posicionesDisparadas[posicionesDisparadas.length - 1];

    if (contadorBarco === 0 && ultimaPosicionDisparada) {
        // Comienza el conteo del barco con la primera posición acertada
        contadorBarco = 1;
    }

    // Si no hay adyacentes pendientes, obtenemos nuevas
    if (pendientesAdyacentes.length === 0 && ultimaPosicionDisparada) {
        pendientesAdyacentes = obtenerCeldasAdyacentes(ultimaPosicionDisparada);
    }

    // Continuar disparando a las celdas adyacentes pendientes
    dispararACeldasAdyacentesPendientes();
}

// Función para obtener el color de una celda
function obtenerColorDeCelda(x, y) {
    robot.moveMouse(x, y);
    const color = robot.getPixelColor(x, y);
    console.log(`Color en (${x}, ${y}): #${color}`); // Para depuración
    return color;
}

// Modificada para actualizar el contador del barco
function dispararACeldasAdyacentesPendientes() {
    if (pendientesAdyacentes.length === 0) {
        console.log(`Barco detectado de tamaño: ${contadorBarco}`);
        is_target = false;
        contadorBarco = 0; // Reiniciar el contador para el próximo barco
        dispararSiguienteCoordenada();
        return;
    }

    let celda = pendientesAdyacentes.shift(); // Tomar la siguiente celda pendiente
    const color = obtenerColorDeCelda(celda.x, celda.y);

    if (color === 'ffffff' || color === 'f7fcf6') {
        console.log(`Disparando a la celda adyacente: ${celda.nombre}`);
        moverYClick(celda);

        // Si aciertas, incrementa el contador del barco
        setTimeout(() => {
            if (detectarMensaje() === "Ataque") {
                contadorBarco++; // Incrementar el tamaño del barco
                manejarObjetivo(); // Continuar buscando adyacentes
            } else {
                console.log("Turno del oponente. Guardando celdas pendientes.");
                is_target = true;
            }
        }, 2000);
    } else if (color === 'f2f4f8' || color === 'fafad6' || color === 'fef5f4' || color === 'c0c0c0') {
        console.log(`Celda ${celda.nombre} no es disparable (fallo o ya disparada).`);
        dispararACeldasAdyacentesPendientes();
    }
}

// Modificar dispararSiguienteCoordenada para siempre verificar las adyacentes pendientes primero
function dispararSiguienteCoordenada() {
    if (pendientesAdyacentes.length > 0) {
        dispararACeldasAdyacentesPendientes();
    } else {
        let siguientePosicion = coordenadas.find(c =>
            !posicionesDisparadas.some(p => p.x === c.x && p.y === c.y)
        );

        if (siguientePosicion) {
            moverYClick(siguientePosicion);
        } else {
            console.log("Ya se disparó a todas las coordenadas disponibles.");
        }
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

    console.log(`Pixeles del mensaje: ${sameColorPixels}`);
    

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