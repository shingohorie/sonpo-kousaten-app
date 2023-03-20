'use strict';

/**
 * 和暦下２桁を西暦４桁に変換する
 * @param {Number} num 和暦下２桁
 * @return {Number} 西暦４桁
 */
const convert = (num) => {
	return num + 1989 - 1;
}

module.exports = {
	convert: convert
}