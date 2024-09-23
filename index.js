const robot = require('@hurdlegroup/robotjs');
const { exec } = require('child_process');

// https://github.com/hurdlegroup/robotjs?tab=readme-ov-file#installation

// Función para hacer una pausa
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para mover el ratón con pausa y clic
async function performMouseActions() {
    // Abre Chrome en la página del juego en Windows
    // exec('open -a "Brave Browser" http://en.battleship-game.org/');

    // Mover el ratón a (400, 700)
    await sleep(3000);
    robot.moveMouse(685, 92);
    // console.log("Mouse moved to (400, 700)");

    // Hacer clic
    await sleep(1000);
    // robot.mouseClick();
    console.log("Mouse clicked at (400, 700)");

    // Mover el ratón a (800, 300)
    await sleep(1000);
    robot.moveMouse(1035, 92);
    // console.log("Mouse moved to (1000, 380)");

    // Hacer clic
    await sleep(1000);
    // robot.mouseClick();
    console.log("Mouse clicked at (1000, 380)");
}

// Ejecutar las acciones del ratón
performMouseActions();
