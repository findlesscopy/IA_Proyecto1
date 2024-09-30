const robot = require('@hurdlegroup/robotjs');
const notifier = require('node-notifier');
const fs = require('fs');
const { exec } = require('child_process');
const pl = require('tau-prolog');
require('tau-prolog/modules/js');

let session = pl.create();
let coordenadas = [];
let posicionesMap = {};
const posicionesReset = {};
const prologFilePath = './Juego.pl';
const posicionesFilePath = './posiciones.txt';
const posicionesresetFilePath = './reset_posiciones.txt';
let posicionesDisparadas = [];
let is_target = false;

let contadorBarco = 0;
let pendientesAdyacentes = [];

const startX = 685;
const posY = 92;

const thresholdStarted = 29;
const threshouldStartOpponent = 37;
const thresholdYourTurn = 11;
const thresholdOpponentTurn = 30;

const barcosClasificados = {
    unoCelda: [],
    dosCeldas: [],
    tresCeldas: [],
    cuatroCeldas: []
};

const coloresDisparable = ['ffffff', 'f7fcf6'];

const coloresNoDisparables = ['f2f4f8', 'fafad6', 'fef5f4', 'c0c0c0', 'ea3323', '333333', 'c8c8c9', 'a7a8aa', 'dee0e2'];

// Función principal async para colocar los barcos
async function ColocarBarcosFinal() {
    console.log("Iniciando ColocarBarcosFinal...");
    
    // Mueve el mouse a la posición del botón de reset
    console.log("Esperando 3 segundos antes de empzar..");
    await esperarSegundos(3); 
    robot.moveMouse(610, 590);
    console.log("Mouse movido a la posición del botón de reset.");

    // Hace clic para abrir la página
    console.log("Esperando 1 segundo antes de hacer clic...");
    await esperarSegundos(1); 
    robot.mouseClick();
    console.log("Clic realizado.");

    // Cargar el archivo Prolog después de 2 segundos
    console.log("Esperando 2 segundos antes de cargar el archivo Prolog...");
    await esperarSegundos(2);
    
    cargarArchivoProlog();
    
    console.log("Archivo Prolog cargado y proceso iniciado.");
}

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
        ColocarBarcosFinal();
    });
}

// Función para cargar posiciones desde archivo
function cargarPosicionesReset() {
    fs.readFile(posicionesresetFilePath, 'utf8', (err, data) => {
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
                posicionesReset[nombre] = { x, y };
            }
        });
        colocarBarcos(); // Inicia la colocación de barcos
    });
}

// Tiempo de espera entre acciones
function esperarSegundos(segundos) {
    return new Promise(resolve => setTimeout(resolve, segundos * 1000));
}

// Función para mover el mouse y arrastrar los barcos
async function moverBarco(origen, destino, orientacion) {
    const { x: origenX, y: origenY } = origen;
    const { x: destinoX, y: destinoY } = destino;

    // Mueve el mouse al origen del barco
    robot.moveMouse(origenX, origenY);
    await esperarSegundos(2);

    // Presiona y arrastra hacia el destino
    robot.mouseToggle("down");
    await esperarSegundos(1);
    robot.dragMouse(destinoX, destinoY);
    robot.mouseToggle("up");
    await esperarSegundos(1);

    // Verificar orientación
    if (orientacion === 'V') {
        robot.moveMouse(destinoX, destinoY);
        await esperarSegundos(1);
        robot.mouseClick(); 
    }

    await esperarSegundos(1);
}

async function openBrowser() {
    // Abre Brave en la página del juego en el sistema
    exec('open -a "Brave Browser" http://en.battleship-game.org/');

    // Esperar 5 segungods antes de continuar
    await esperarSegundos(5);

    cargarPosiciones();
}

// Función para colocar todos los barcos siguiendo el flujo
async function colocarBarcos() {

    // Coordenadas iniciales de los barcos
    const posicionesIniciales = {
        barco4: { x: 420, y: 255 },
        barco3_1: { x: 420, y: 320 },
        barco3_2: { x: 530, y: 320 },
        barco2_1: { x: 420, y: 385 },
        barco2_2: { x: 500, y: 385 },
        barco2_3: { x: 580, y: 385 },
        barco1_1: { x: 415, y: 450 },
        barco1_2: { x: 465, y: 450 },
        barco1_3: { x: 515, y: 450 },
        barco1_4: { x: 565, y: 450 }
    };

    // Colocar el barco de 4 celdas
    const destinoBarco4 = posicionesReset[barcosClasificados.cuatroCeldas[0].posicion]; // Obtener destino de 4 celdas
    await moverBarco(posicionesIniciales.barco4, destinoBarco4, barcosClasificados.cuatroCeldas[0].orientacion);

    // Colocar barcos de 3 celdas
    for (let i = 0; i < barcosClasificados.tresCeldas.length; i++) {
        const destinoBarco3 = posicionesReset[barcosClasificados.tresCeldas[i].posicion];
        await moverBarco(posicionesIniciales[`barco3_${i+1}`], destinoBarco3, barcosClasificados.tresCeldas[i].orientacion);
    }

    // Colocar barcos de 2 celdas
    for (let i = 0; i < barcosClasificados.dosCeldas.length; i++) {
        const destinoBarco2 = posicionesReset[barcosClasificados.dosCeldas[i].posicion];
        await moverBarco(posicionesIniciales[`barco2_${i+1}`], destinoBarco2, barcosClasificados.dosCeldas[i].orientacion);
    }

    // Colocar barcos de 1 celda
    for (let i = 0; i < barcosClasificados.unoCelda.length; i++) {
        const destinoBarco1 = posicionesReset[barcosClasificados.unoCelda[i].posicion];
        await moverBarco(posicionesIniciales[`barco1_${i+1}`], destinoBarco1, barcosClasificados.unoCelda[i].orientacion);
    }

    console.log("Todos los barcos han sido colocados.");

    darleStart();
    
}

function darleStart () {
    setTimeout(() => {
        robot.moveMouse(980, 330);
    }, 2000);

    setTimeout(() => {
        robot.mouseClick();
    }, 2000);

    // Empieza la logica del juego
    empezandoJuego();

}

// Función para cargar el archivo Prolog
function cargarArchivoProlog() {
    fs.readFile(prologFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error al leer el archivo Prolog:", err);
            return;
        }
        session.consult(data, {
            success: () => {
                console.log("Archivo Prolog cargado.");
                obtenerCoordenadasBarcos(); // Llama a la función para obtener las coordenadas
            },
            error: (err) => console.error("Error al cargar Prolog:", err)
        });
    });
}

// Función para procesar los resultados de los barcos y almacenar en el mapa
function procesarResultadosBarcos(predicado, callback) {
    session.answer({
        success: function(answer) {
            let result = pl.format_answer(answer);

            // Usar regex para extraer los valores
            let match = result.match(/X = (\w+), Orientacion = (\w+)/);
            if (match) {
                let nombre = match[1];
                let orientacion = match[2];

                // Imprime las coordenadas y orientaciones de los barcos
                // console.log(`Barco: ${nombre}, Orientación: ${orientacion}`);

                // Almacena en el mapa las posiciones de cada barco según su tipo
                posicionesReset[nombre] = { orientacion: orientacion };

                // Busca la siguiente respuesta
                procesarResultadosBarcos(predicado, callback); // Llama de nuevo para obtener la siguiente respuesta
            } else {
                // console.log(`No hay más respuestas para ${predicado}.`);
                callback(); // Llama al callback para continuar
            }
        },
        fail: function() {
            // console.log(`Error al obtener la respuesta para ${predicado}. Puede que no haya más.`);
            callback(); // Llama al callback para continuar
        }
    });
}

// Función para obtener todas las coordenadas de los barcos
function obtenerCoordenadasBarcos() {
    let predicados = [
        "barco_una_celda(X, Orientacion).",
        "barco_dos_celdas(X, Orientacion).",
        "barco_tres_celdas(X, Orientacion).",
        "barco_cuatro_celdas(X, Orientacion)."
    ];

    let index = 0; // Índice para recorrer los predicados

    function procesarSiguiente() {
        if (index < predicados.length) {
            session.query(predicados[index], {
                success: () => {
                    procesarResultadosBarcos(predicados[index], () => {
                        index++; // Avanza al siguiente 
                        procesarSiguiente(); // Llama a la siguiente consulta
                    });
                },
                fail: () => {
                    console.error(`Error al consultar ${predicados[index]} en Prolog.`);
                    index++; // Avanza al siguiente , aunque falle
                    procesarSiguiente(); // Llama a la siguiente consulta
                }
            });
        } else {
            // Se han procesado todos los predicados
            // console.log("Coordenadas obtenidas:", posicionesReset);
            clasificarBarcos(); // Clasifica los barcos
            cargarPosicionesReset(); // Carga las posiciones de los barcos desde el archivo
        }
    }
    // Iniciar el proceso
    procesarSiguiente();
}

// Función para clasificar los barcos por su tipo
function clasificarBarcos() {
    // Clasificar los barcos según su posición
    Object.keys(posicionesReset).forEach((posicion, index) => {
        const barco = posicionesReset[posicion];
        if (index < 4) {
            barcosClasificados.unoCelda.push({ posicion, ...barco });
        } else if (index < 7) {
            barcosClasificados.dosCeldas.push({ posicion, ...barco });
        } else if (index < 9) {
            barcosClasificados.tresCeldas.push({ posicion, ...barco });
        } else {
            barcosClasificados.cuatroCeldas.push({ posicion, ...barco });
        }
    });
}

function empezandoJuego () {
    obtenerTodasCoordenadas();
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
                } else if (haunting === 'segundo_haunting') {
                    session.query("celdas_restantes(Nombre).", {
                        success: function() {
                            processNext('celdas_restantes');
                        },
                        fail: function() {
                            console.error("Error en celdas_restantes.");
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
            } else if (haunting === 'segundo_haunting') {
                session.query("celdas_restantes(Nombre).", {
                    success: function() {
                        processNext('celdas_restantes');
                    },
                    fail: function() {
                        console.error("Error en celdas_restantes.");
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

// Función para manejar las adyacentes y contar el tamaño del barco
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

// Función para actualizar el contador del barco
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

    if (coloresDisparable.includes(color)) {
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
    } else if (coloresNoDisparables.includes(color)) {
        console.log(`Celda ${celda.nombre} no es disparable (fallo o ya disparada).`);
        dispararACeldasAdyacentesPendientes();
    }
}

// Funcioón para dispararSiguienteCoordenada para siempre verificar las adyacentes pendientes primero
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
            notifier.notify({ title: 'Termina el juego obligatoriamiente', message: 'El jugador ha abandonado. Se termina la ejecución.', sound: true });
            process.exit(0);
        } else if (currentColor === 'ea3323') {
            console.log("Se termina la ejecución, has perdido.");
            notifier.notify({ title: '¡ Suerte para la próxima !', message: 'Juego Finalizado. Has perdido.', sound: true });
            process.exit(0);
        } else if (currentColor === '377e22') {
            console.log("Se termina la ejecución, has ganado.");
            notifier.notify({ title: '¡ Felicidades !', message: 'Juego Finalizado. Has ganado.', sound: true });
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

openBrowser();