% Reglas para la colocación de los barcos en el tablero
% Barcos de una celda
barco_una_celda('A1', 'H').
barco_una_celda('B10', 'H').
barco_una_celda('C2', 'H').
barco_una_celda('J10', 'H').

% Barcos de dos celdas
barco_dos_celdas('E1', 'H').
barco_dos_celdas('A8', 'H').
barco_dos_celdas('H2', 'H').

% Barcos de tres celdas
barco_tres_celdas('D4', 'H').
barco_tres_celdas('H6', 'V').

% Barcos de cuatro celdas
barco_cuatro_celdas('F6', 'V').

% Reglas que dan las primer_haunting de las posiciones con alta probabilidad de tener un objetivo
primer_haunting('A1').
primer_haunting('A3').
primer_haunting('A5').
primer_haunting('A7').
primer_haunting('A9').
primer_haunting('C1').
primer_haunting('C3').
primer_haunting('C5').
primer_haunting('C7').
primer_haunting('C9').
primer_haunting('E1').
primer_haunting('E3').
primer_haunting('E5').
primer_haunting('E7').
primer_haunting('E9').
primer_haunting('G1').
primer_haunting('G3').
primer_haunting('G5').
primer_haunting('G7').
primer_haunting('G9').
primer_haunting('I1').
primer_haunting('I3').
primer_haunting('I5').
primer_haunting('I7').
primer_haunting('I9').

% Reglas que dan si el primer_haunting se ha terminado
segundo_haunting('A2').
segundo_haunting('A4').
segundo_haunting('A6').
segundo_haunting('A8').
segundo_haunting('A10').
segundo_haunting('C2').
segundo_haunting('C4').
segundo_haunting('C6').
segundo_haunting('C8').
segundo_haunting('C10').
segundo_haunting('E2').
segundo_haunting('E4').
segundo_haunting('E6').
segundo_haunting('E8').
segundo_haunting('E10').
segundo_haunting('G2').
segundo_haunting('G4').
segundo_haunting('G6').
segundo_haunting('G8').
segundo_haunting('G10').
segundo_haunting('I2').
segundo_haunting('I4').
segundo_haunting('I6').
segundo_haunting('I8').
segundo_haunting('I10').

% Reglas que dan si el segundo_haunting se ha terminado
celdas_restantes('B1').
celdas_restantes('B2').
celdas_restantes('B3').
celdas_restantes('B4').
celdas_restantes('B5').
celdas_restantes('B6').
celdas_restantes('B7').
celdas_restantes('B8').
celdas_restantes('B9').
celdas_restantes('B10').
celdas_restantes('D1').
celdas_restantes('D2').
celdas_restantes('D3').
celdas_restantes('D5').
celdas_restantes('D6').
celdas_restantes('D7').
celdas_restantes('D8').
celdas_restantes('D9').
celdas_restantes('D10').
celdas_restantes('F1').
celdas_restantes('F2').
celdas_restantes('F3').
celdas_restantes('F4').
celdas_restantes('F5').
celdas_restantes('F7').
celdas_restantes('F8').
celdas_restantes('F9').
celdas_restantes('F10').
celdas_restantes('H1').
celdas_restantes('H3').
celdas_restantes('H4').
celdas_restantes('H5').
celdas_restantes('H7').
celdas_restantes('H8').
celdas_restantes('H9').
celdas_restantes('H10').
celdas_restantes('J1').
celdas_restantes('J2').
celdas_restantes('J3').
celdas_restantes('J4').
celdas_restantes('J5').
celdas_restantes('J6').
celdas_restantes('J7').
celdas_restantes('J8').
celdas_restantes('J9').
celdas_restantes('J10').
