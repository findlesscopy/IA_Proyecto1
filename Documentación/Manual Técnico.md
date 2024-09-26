
# Objetivos
## Objetivo General
<p style="text-align: justify;"> Desarrollar un sistema integrado que combine la función de Tau Prolog para la toma de decisiones estratégicas y Robot.js para la ejecución automatizada de acciones en el navegador, optimizando el desempeño en el juego Battleship Game.</p>

## Objetivos Específicos

<ul>
  <li>
     <div style="text-align: justify;"> 
	Integrar Tau Prolog y Robot.js de manera eficiente, permitiendo la automatización fluida de las decisiones lógicas y su ejecución en el entorno del navegador.
	</div>
  </li>
  <li>
    <div style="text-align: justify;">
      Desarrollar una automatización de colocación estratégica de piezas, utilizando datos de análisis anteriores para determinar las posiciones con mayor tasa de éxito, basado en estadísticas y patrones de victorias anteriores.
    </div>
  </li>
    <li>
    <div style="text-align: justify;">
    Implementar un sistema de toma de decisiones optimizado que evalúe dinámicamente las casillas del tablero y seleccione las mejores opciones durante cada turno del juego, incrementando la probabilidad de acertar los barcos del oponente.
    </div>
  </li>
    <li>
    <div style="text-align: justify;">
      Automatizar las acciones en la interfaz del navegador, asegurando una interacción precisa y eficiente con los elementos del juego, como el reinicio de partidas, la colocación de piezas y la selección de casillas.
    </div>
  </li>
    <li>
    <div style="text-align: justify;">
      Aquí va otro ítem justificado de la lista. Puedes agregar tantas viñetas como desees.
    </div>
  </li>
    <li>
    <div style="text-align: justify;">
      Sincronizar las decisiones de Tau Prolog con las acciones de Robot.js, garantizando una respuesta rápida y coherente entre la lógica del juego y su ejecución en tiempo real.
    </div>
  </li>
</ul>

<div style="page-break-after: always;"></div>

# Uso de tecnologías

Para este proyecto se hace uso de tecnologías como `Robot.js` y  `Tau Prolog`

## Pasos para el uso de tecnologías

### Robot.js

Actualmente si se intenta instalar desde `npm install robotjs` contiene el siguiente error:

```sh
npm WARN deprecated npmlog@4.1.2: This package is no longer supported.
npm WARN deprecated are-we-there-yet@1.1.7: This package is no longer supported.
npm WARN deprecated gauge@2.7.4: This package is no longer supported.
``` 

Por lo que se hace uso de un fork con autor `hurdlegroup`

```sh
npm install @hurdlegroup/robotjs
```

Un ejemplo básico de uso es el siguiente:

```js
const robot = require('@hurdlegroup/robotjs');
robot.moveMouse(100, 200); // Mueve el mouse a la posición X:100, Y:200
robot.mouseClick();         // Hace clic en la posición actual del mouse

```

### Tau Prolog

Para este caso si se puede instalar normal desde `npm`

```sh
npm install tau-prolog
```

Ejemplo básico de una consulta 

```
const pl = require("tau-prolog");
const session = pl.create();
session.consult('nombre_archivo.pl', {
   success: function() { 
     session.query('decision_estrategica(X).');
   }
});
```

### Uso de las herramientas juntas

Una vez configuradas las herramientas, el sistema puede ejecutarse con los siguientes pasos:

<ul>
  <li>
     <div style="text-align: justify;"> 
	Iniciar el script principal en robot.js que integra tanto la toma de decisiones con Tau Prolog como la automatización.
	</div>
  </li>
  <li>
    <div style="text-align: justify;">
      Verificar que las acciones en el navegador son correctas, como la colocación de las piezas y las selecciones durante el juego.
    </div>
</ul>

<div style="page-break-after: always;"></div>

# Métodos utilizados

<p style="text-align: justify;">
Este es el texto que quieres justificar. Este texto se verá justificado cuando se exporte a PDF o al visualizarlo en Obsidian.
</p>

Aquí van las metodos...

<div style="page-break-after: always;"></div>

# Archivos creados

Los archivos que se usaron para el desarrollo del proyecto son los siguientes:

* Battleship.js
* Juego.pl

### 1. Archivo de js

<ul>
  <li>
     <div style="text-align: justify;"> 
	Propósito: Este archivo contiene el código JavaScript responsable de la interacción automatizada con la página web del juego Battleship Game. Utiliza la biblioteca robot.js para simular acciones de usuario, como mover el ratón, hacer clic en celdas específicas y leer la matriz de posiciones en el tablero del juego. También maneja la lógica para identificar cuándo es el turno del jugador en base a los mensajes que aparecen en la interfaz del juego.
	</div>
  </li>
  <li>
   <div style="text-align: justify;"> 
    Principales funciones y responsabilidades:
</div>
<ul>
  <li>
     <div style="text-align: justify;"> 
	Lectura de la matriz de posiciones: El archivo contiene un método para identificar y leer las posiciones actuales de los barcos y las casillas seleccionadas en el juego.
	</div>
  </li>
  <li>
    <div style="text-align: justify;">
      Colocación automática de barcos: Utilizando la información de destinos obtenida desde el archivo Prolog (tau-prolog.pl), el script de robot.js mueve el ratón y coloca los barcos en las coordenadas calculadas por el algoritmo en Prolog.
    </div>
</li>
  <li>
     <div style="text-align: justify;"> 
	Manejo de las decisiones de "haunting": En el juego, el algoritmo Prolog decide qué celdas tienen mayor probabilidad de tener un barco enemigo. robot.js ejecuta esas decisiones moviendo el ratón y haciendo clic en dichas celdas.
	</div>
  </li>
  <li>
     <div style="text-align: justify;"> 
	Gestión de turnos: Se detecta si es el turno del jugador basándose en mensajes visibles en la página web, como "Your turn" o "Opponent's turn", lo que permite al sistema tomar decisiones automáticamente durante el turno del jugador.
	</div>
  </li>
  <li>
     <div style="text-align: justify;"> 
	Interacción con Tau Prolog: robot.js también se encarga de consultar los predicados y reglas definidas en el archivo Prolog para recibir las mejores decisiones posibles durante el juego.
	</div>
  </li>
</ul>
    </div>



### 2. Archivo de Tau prolog

<ul>
  <li>
     <div style="text-align: justify;"> 
	Propósito: Este archivo contiene las reglas y hechos en Prolog que permiten realizar la toma de decisiones lógica del juego. Específicamente, contiene las reglas para la colocación de barcos y para seleccionar las celdas con mayor probabilidad de acierto durante el juego, basándose en la estrategia del "primer haunting" y "segundo haunting".
	</div>
  </li>
  <li>
   <div style="text-align: justify;"> 
    Principales funciones y responsabilidades:
</div>
<ul>
  <li>
     <div style="text-align: justify;"> 
	Colocación de barcos: El archivo define reglas para la colocación de los barcos en el tablero según el tamaño de los mismos. Cada barco está asociado a una celda inicial y una orientación (`H` para horizontal, `V` para vertical), lo que es utilizado por el sistema automatizado para realizar la colocación inicial.
	</div>
  </li>
  <li>
    <div style="text-align: justify;">
     Decisiones de "haunting: Se implementan reglas que determinan las celdas que tienen mayor probabilidad de contener barcos enemigos. El "primer haunting" define las primeras posiciones estratégicas a atacar, y el "segundo haunting" se activa cuando no se ha acertado un barco durante las primeras fases del juego.
    </div>
</li>
  <li>
     <div style="text-align: justify;"> 
	Interacción con robot.js: Las decisiones lógicas tomadas por Prolog son enviadas a robot.js, que ejecuta las acciones correspondientes en la interfaz gráfica del juego. Por ejemplo, Prolog selecciona una casilla con alta probabilidad de éxito, y robot.js se encarga de mover el ratón y hacer clic en esa casilla.
	</div>
  </li>
</ul>
    </div>

## Relación entre archivos

<ul>
  <li>
     <div style="text-align: justify;"> 
	robot.js actúa como el ejecutor de las decisiones que tau-prolog.pl toma. Mientras que el archivo Prolog contiene toda la lógica y las estrategias del juego, robot.js se encarga de realizar esas acciones en el juego, como colocar barcos o seleccionar casillas.
	</div>
  </li>
  <li>
   <div style="text-align: justify;"> 
    Juntos, estos archivos permiten la automatización completa de la partida en Battleship Game, desde la colocación inicial de los barcos hasta la elección de las celdas a atacar basándose en probabilidades calculadas por el sistema.
</div>
</ul>
