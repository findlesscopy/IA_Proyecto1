def generar_coordenadas_formateadas(inicio_x, inicio_y, incremento, filas, columnas):
    """Genera un archivo de texto con coordenadas en el formato A1 (X: 945, Y: 215).

    Args:
        inicio_x: Coordenada X inicial.
        inicio_y: Coordenada Y inicial.
        incremento: Incremento en X e Y para cada posición.
        filas: Número de filas de la matriz.
        columnas: Número de columnas de la matriz.
    """

    with open("posiciones.txt", "w") as archivo:
        for y in range(filas):
            for x in range(columnas):
                columna = chr(ord('A') + x)
                fila = y + 1
                coord_x = inicio_x + x * incremento
                coord_y = inicio_y + y * incremento
                linea = f"{columna}{fila} (X: {coord_x}, Y: {coord_y})\n"
                archivo.write(linea)

# Parámetros para tu caso específico:
inicio_x = 945
inicio_y = 215
incremento = 30
filas = 10
columnas = 10

# Generar el archivo de coordenadas
generar_coordenadas_formateadas(inicio_x, inicio_y, incremento, filas, columnas)