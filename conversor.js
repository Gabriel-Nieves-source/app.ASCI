/*
 * APP ASCII móvil - lógica de conversión.
 * Es la misma lógica de la clase ConversorAscii de la versión Java,
 * escrita en JavaScript para que funcione en celulares (Android e iOS).
 * No depende de la interfaz, por eso se prueba sola con Node (pruebas/).
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.ConversorAscii = fabrica();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_CARACTERES = 100;
  /** El ASCII estándar va de 0 a 127. */
  var MAX_ASCII = 127;

  function rellenar(texto, ancho, caracter) {
    texto = String(texto);
    while (texto.length < ancho) texto = caracter + texto;
    return texto;
  }

  function aIzquierda(texto, ancho) {
    texto = String(texto);
    while (texto.length < ancho) texto += ' ';
    return texto;
  }

  /** Sistemas numéricos en que se puede mostrar cada código. */
  var FORMATOS = {
    DECIMAL: {
      id: 'DECIMAL', nombre: 'Decimal', corto: 'DEC', base: 10,
      formatear: function (codigo) { return String(codigo); }
    },
    HEXADECIMAL: {
      id: 'HEXADECIMAL', nombre: 'Hexadecimal', corto: 'HEX', base: 16,
      formatear: function (codigo) { return rellenar(codigo.toString(16).toUpperCase(), 2, '0'); }
    },
    OCTAL: {
      id: 'OCTAL', nombre: 'Octal', corto: 'OCT', base: 8,
      formatear: function (codigo) { return rellenar(codigo.toString(8), 3, '0'); }
    },
    BINARIO: {
      id: 'BINARIO', nombre: 'Binario (8 bits)', corto: 'BIN', base: 2,
      formatear: function (codigo) {
        var bin = codigo.toString(2);
        var bits = Math.max(8, Math.ceil(bin.length / 8) * 8);
        return rellenar(bin, bits, '0');
      }
    }
  };

  /** Opciones del selector de separador (igual que en la versión de escritorio). */
  var SEPARADORES = [
    { id: 'espacio', nombre: 'Espacio', valor: ' ' },
    { id: 'coma', nombre: 'Coma ( , )', valor: ', ' },
    { id: 'guion', nombre: 'Guion ( - )', valor: '-' },
    { id: 'puntoycoma', nombre: 'Punto y coma ( ; )', valor: '; ' },
    { id: 'salto', nombre: 'Salto de línea', valor: '\n' },
    { id: 'ninguno', nombre: 'Ninguno', valor: '' },
    { id: 'personalizado', nombre: 'Personalizado…', valor: null }
  ];

  function errorValidacion(mensaje) {
    var e = new Error(mensaje);
    e.name = 'ErrorValidacion';
    return e;
  }

  /** Lanza un ErrorValidacion con un mensaje listo para mostrar al usuario. */
  function validar(texto) {
    if (texto === null || texto === undefined || String(texto).trim() === '') {
      throw errorValidacion('El campo de texto está vacío. Escribe al menos un carácter.');
    }
    if (texto.length > MAX_CARACTERES) {
      throw errorValidacion('El texto supera el máximo de ' + MAX_CARACTERES +
        ' caracteres (tiene ' + texto.length + ').');
    }
  }

  /** Valida el separador personalizado: de 1 a 3 caracteres. */
  function validarSeparadorPersonalizado(sep) {
    if (sep === null || sep === undefined || sep.length === 0 || sep.length > 3) {
      throw errorValidacion('Escribe un separador personalizado de 1 a 3 caracteres.');
    }
    return sep;
  }

  /** Nombre legible para caracteres que no se ven. */
  function nombreVisible(c) {
    if (c === ' ') return '(espacio)';
    if (c === '\n') return '(salto línea)';
    if (c === '\t') return '(tabulación)';
    return "'" + c + "'";
  }

  /**
   * Convierte el texto a códigos ASCII.
   * @param {string} texto
   * @param {object} formato  uno de FORMATOS
   * @param {string} separador texto entre códigos (puede ser vacío)
   */
  function convertir(texto, formato, separador) {
    validar(texto);
    if (!formato || typeof formato.formatear !== 'function') {
      throw errorValidacion('Selecciona un sistema numérico.');
    }
    if (separador === null || separador === undefined) separador = '';

    var limpio = texto.replace(/\r/g, '');
    var codigos = [];
    var filas = [];
    var noAscii = [];
    var partes = [];

    for (var i = 0; i < limpio.length; i++) {
      var c = limpio.charAt(i);
      var codigo = limpio.charCodeAt(i);        // igual que (int) c en Java
      codigos.push(codigo);
      var fuera = codigo > MAX_ASCII;
      if (fuera && noAscii.indexOf(c) === -1) noAscii.push(c);
      partes.push(formato.formatear(codigo));
      filas.push({
        caracter: c,
        visible: nombreVisible(c),
        decimal: FORMATOS.DECIMAL.formatear(codigo),
        hexadecimal: FORMATOS.HEXADECIMAL.formatear(codigo),
        octal: FORMATOS.OCTAL.formatear(codigo),
        binario: FORMATOS.BINARIO.formatear(codigo),
        fueraAscii: fuera
      });
    }

    var secuencia = partes.join(separador);
    var tabla = tablaTexto(filas, noAscii.length > 0);

    return {
      codigos: codigos,
      secuencia: secuencia,
      filas: filas,
      tabla: tabla,
      noAscii: noAscii,
      tieneAdvertencias: noAscii.length > 0,
      formato: formato,
      textoCompleto: 'RESULTADO (' + formato.nombre + '):\n' + secuencia + '\n\n' +
        'DETALLE POR CARÁCTER:\n' + tabla
    };
  }

  /** Tabla en texto plano, igual a la de la versión de escritorio. */
  function tablaTexto(filas, conNota) {
    var lineas = [];
    var fila = function (a, b, c, d, e) {
      return aIzquierda(a, 14) + ' ' + aIzquierda(b, 8) + ' ' + aIzquierda(c, 6) + ' ' + aIzquierda(d, 6) + ' ' + e;
    };
    lineas.push(fila('Carácter', 'Decimal', 'Hex', 'Octal', 'Binario'));
    lineas.push(fila('------------', '-------', '----', '-----', '--------'));
    filas.forEach(function (f) {
      lineas.push(fila(f.visible, f.decimal, f.hexadecimal, f.octal, f.binario + (f.fueraAscii ? ' *' : '')));
    });
    var salida = lineas.join('\n') + '\n';
    if (conNota) salida += '\n* Fuera del ASCII estándar (0-127): se muestra su código Unicode.\n';
    return salida;
  }

  /** Contenido del archivo exportado. */
  function textoExportado(textoOriginal, resultado) {
    return 'TEXTO ORIGINAL:\n' + textoOriginal + '\n\n' + resultado.textoCompleto;
  }

  return {
    MAX_CARACTERES: MAX_CARACTERES,
    MAX_ASCII: MAX_ASCII,
    FORMATOS: FORMATOS,
    SEPARADORES: SEPARADORES,
    validar: validar,
    validarSeparadorPersonalizado: validarSeparadorPersonalizado,
    convertir: convertir,
    nombreVisible: nombreVisible,
    textoExportado: textoExportado
  };
});
