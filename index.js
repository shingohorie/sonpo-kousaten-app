'use strict';

// dependencies.
const consola = require('consola');
const fs = require('fs-extra');
const fl = require('node-filelist');
const appRootPath = require('app-root-path');
const nqdm = require('nqdm');
const beautify = require('js-beautify');

// replacer
const replacer = require('./lib/replacer');

// tsv parser
const tsvParser = require('./lib/tsvParser');

//ルートパス
const rootDir = appRootPath.resolve('.') + '/';

//設定ファイルやテンプレートの格納先のパス
const path = {
	config: rootDir + '__conf/config.tsv',
	replacer: rootDir + '__conf/replacement.csv',
	template: rootDir + '__template/'
}

//設定データ
let template = {};
let config = {};

/**
 * 設定にもとづいてファイルを移行
 * @return {promise}
 */
const convert = () => {
	const __convert = (i) => {
		if (i < config.length) {
			progressbar.process();

			const conf = config[i];
			//const oldURL = rootDir + conf.oldURL;
			const newURL = rootDir + conf.newURL;
			const year = conf.year;
			const type = conf.type;
			const title = conf.title;
			const bodyID = conf.bodyID;
			let html, templateHTML, targetHTML;

			new Promise((resolve, reject) => {
				let targetHTML = conf.targetHTML;
				let replacementPair = [
					[/\[year\]/, year],
					[/\[title\]/, title],
					[/\[insert\]/, replacer.replace(targetHTML)],
					[/\[bodyID\]/, bodyID],
					[/\[newURL\]/, newURL.replace(rootDir,'')],
					[/<!--function/, "<!--\r\nfunction"]
				];
				switch (type) {
					case 'general': 
					case 'top': 
						templateHTML = template.general; 
						replacementPair.push([/<!-- ページの先頭に戻る -->(.)*<!-- ページの先頭に戻る -->/, '']);
						break;
					case 'ruikei': 
						templateHTML = template.ruikei; 
						break;
					case 'sXXXX': 
						templateHTML = template.sXXXX; 
						break;
				}
				templateHTML = replacer.replace(templateHTML, replacementPair);
				html = beautify.html(templateHTML, {indent_char: '	'});
				resolve(html);
			}).then((html) => {
				return new Promise((resolve, reject) => {
					fs.outputFile(newURL, html, 'utf8', (err) => { resolve(); });
				})
			}).then(() => {
				__convert(i+1);
			});
		}
	}
	const progressbar = nqdm(config.length);
	__convert(0);
}

/**
 * テンプレートが格納されたディレクトリを読み、連想配列形式の設定データ(テンプレート)を生成する
 * @param {String} dir テンプレートが格納されたディレクトリ
 * @return {promise}
 */
const getTemplate = (dir) => {
	let tmp = {};
	return new Promise((resolve, reject) => {

		// 取得したファイル一覧を読み出す
		const getTempalteHTML = (results, callback) => {
			// ファイルを読み、該当するキーでHTML文字列を保持させる
			const __readFile = (filename) => {
				return new Promise((resolve, reject) => {
					fs.readFile(filename, 'utf-8', function(err, data) {
						let file = filename.substring(filename.lastIndexOf('/') + 1, filename.length);
						let str = data.replace(/\t/g, '').replace(/\r?\n/g, ''); // 改行やタブを削除して整形
 						switch (file) {
							case 'index.html': tmp.general = str; break;
							case 'popup.html': tmp.sXXXX = str; break;
							case 'popup2.html': tmp.ruikei = str; break;
						}
						resolve();
					});
				});
			}
			// 各ファイルを読み込む処理を配列に追加
			const promises = results.map((res) => { return __readFile(res); });
			// 全て読み込み終わったらresolve
			Promise.all(promises).then(callback);
		}

		// ディレクトリ配下のHTLを取得し、完了したらresolve
		fl.read([dir], { 'ext': 'html' }, (results, err) => {
			if (err) { reject(new Error(`Cannot read ${dir}`)); return; }
			// 取得したファイル一覧を読み出す
			getTempalteHTML(results.map((res) => {
				return res.path;
			}), () => {
				resolve(tmp);
			});
		});
	})
}

// 実行
const main = async () => {
	try {
		await replacer.init(path.replacer);
		template = await getTemplate(path.template);
		config = await tsvParser.parse(path.config, {
			columns: ['oldURL', 'newURL', 'year', 'type', 'title', 'bodyID', 'targetHTML']
		});
		convert();
	} catch (e) {
		consola.error(e);
	}
}

main();
