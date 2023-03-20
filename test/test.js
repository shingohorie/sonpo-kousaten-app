'use strict';
const assert = require('assert');
const replacer = require('../lib/replacer');
const tsvParser = require('../lib/tsvParser');

describe('#replacer.replace()', () => {
	const str = '/efforts/reduction/kousaten29/';

	it('通常の置換', () => {
		assert.equal(replacer.replace(str, [ [ 'efforts', 'about'] ]), '/about/reduction/kousaten29/');
	});

	it('正規表現の置換', () => {
		assert.equal(replacer.replace(str, [ [ /kousaten(\d*)/, '$1'] ]), '/efforts/reduction/29/');
	});

	it('通常の置換による文字列削除', () => {
		assert.equal(replacer.replace(str, [ [ 'efforts', ''] ]), '//reduction/kousaten29/');
	});

	it('正規表現の置換による文字列削除', () => {
		assert.equal(replacer.replace(str, [ [ /kousaten(\d*)/, ''] ]), '/efforts/reduction//');
	});

});

describe('#tsvParser.parse()', () => {
	// 正常系
	it('有効な形式のTSV文字列が渡される', async () => {
		let result = await tsvParser.parse('lorem	ipsum	dolor	sit	amet');
		assert.deepEqual(result, [ { lorem :'lorem', ipsum :'ipsum', dolor :'dolor', sit :'sit', amet :'amet' } ]);
	});

	it('存在して有効な形式のTSVファイルパスが渡される', async () => {
		let result = await tsvParser.parse('test/valid.tsv');
		assert.deepEqual(result, [ { lorem :'lorem', ipsum :'ipsum', dolor :'dolor', sit :'sit', amet :'amet' } ]);
	});

	it('有効な形式のTSV文字列に対してヘッダーを指定する', async () => {
		let result = await tsvParser.parse('lorem	ipsum	dolor	sit	amet', {
			columns: ['key1', 'key2', 'key3', 'key4', 'key5']
		});
		assert.deepEqual(result, [ { key1 :'lorem', key2 :'ipsum', key3 :'dolor', key4 :'sit', key5 :'amet' } ]);
	});

	it('存在して有効な形式のTSVファイルパスに対してヘッダーを指定する', async () => {
		let result = await tsvParser.parse('test/valid.tsv', {
			columns: ['key1', 'key2', 'key3', 'key4', 'key5']
		});
		assert.deepEqual(result, [ { key1 :'lorem', key2 :'ipsum', key3 :'dolor', key4 :'sit', key5 :'amet' } ]);
	});

	// 異常系
	it('無効な形式の文字列が渡される', async () => {
		let result = await tsvParser.parse('lorem, ipsum, dolor, sit, amet');
		assert.deepEqual(result, []);
	});

	it('存在しないTSVファイルパスが渡される', async () => {
		let result = await tsvParser.parse('test/notfound.tsv');
		assert.deepEqual(result, []);
	});

	it('存在するが無効な形式のTSVファイルパスが渡される', async () => {
		let result = await tsvParser.parse('test/invalid.tsv');
		assert.deepEqual(result, []);
	});
});
