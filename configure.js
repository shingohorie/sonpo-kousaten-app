'use strict';

// dependencies.
const iconv = require('iconv-lite');
const appRootPath = require('app-root-path');
const fs = require('fs-extra');
const nqdm = require('nqdm');
const cheerio = require('cheerio');

// source getter
const sourceGetter = require('./lib/sourceGetter');
// calendar converter
const calendarConverter = require('./lib/calendarConverter');

// ルートパス
const rootDir = appRootPath.resolve('.') + '/';
// 移行対象ディレクトリ
const baseDir = ['kousatenmap30'];
// 除外ディレクトリ
const exclusion = ['\/html5jp\/', '\/data\/', '\/news\/', '\/node_modules\/', '\/__template\/'];
// 移行元ページのパスを格納
let sources = [];
// TSVファイルとなる整形された情報を格納
let outputs = [];

/**
 * configファイルの生成。HTMLをクロールして必要な情報を整形する。
 * @return {promise}
 */
const generateConfig = () => {
	let tmp = [];
	let progressbar = nqdm(sources.length);

	return new Promise( (resolve, reject) => {
		let __generateConfig = (i) => {

			progressbar.process();

			if (i < sources.length) {
				let source = sources[i];
				let record = [];
				let oldPath = source.path.replace(rootDir, '');
				let template, type, year, newPath, isPopup, titleText, hasTarget, targetHTML, bodyID;

				// ファイル名やパスからテンプレート種別を決定
				if (/ruikei_kaisetsu(\d)?/.test(oldPath)) {
					type = 'ruikei';
				} else if (/s(\d{4})/.test(oldPath)) {
					type = 'sXXXX';
				} else {
					type = /kousatenmap(\d+)\/index.html$/.test(oldPath) ? 'top' : 'general';
				}

				// 年度や移植後のパスを生成
				isPopup = (type === 'ruikei' || type === 'sXXXX');
				let __year = parseInt(oldPath.match(/kousatenmap(\d+)/)[1]);
				year = calendarConverter.convert(__year);
				newPath = oldPath.replace(/kousatenmap(\d+)/, year);

				new Promise((resolve, reject) => {
					// 移行元HTMLを取得
					fs.readFile(oldPath, (err, data) => {
						// SJISから変換後、改行やタブを削除して整形
						let stringData = iconv.decode(data, 'windows-31j').replace(/(Shift_JIS|shift_jis)/, 'utf-8').replace(/\t/g, '').replace(/\r?\n/g, '');
						// HTMLをcheerioのオブジェクトにパース
						let $ = cheerio.load(stringData, { decodeEntities: false });

						if (!isPopup) {
							// 通常ページ以外はh2の値をtitleとして取得する
							// 通常ページ以外は#contentsのHTMLを取得する
							titleText = type === 'general' ? $('h2').text() + '｜事故多発交差点マップ (' + year +'年度版)' : '事故多発交差点マップ (' + year +'年度版)';
							hasTarget = /<!-- コンテンツエリア -->/.test(stringData) && /<!-- \/\/コンテンツエリア --/.test(stringData);
							targetHTML = hasTarget ? stringData.match(/<!-- コンテンツエリア -->(.*)<!-- \/\/コンテンツエリア -->/)[1] : '';
							bodyID = stringData.match(/<body id="([^>]*)">/);
							bodyID = bodyID ? bodyID[1].trim() : '';
							targetHTML = `<!-- コンテンツエリア -->${targetHTML}<!-- //コンテンツエリア -->`;
						} else {
							// ポップアップページは固定の文字列をtitleとして設定する
							// ポップアップページ以外はbodyのHTMLを取得する
							titleText = type === 'ruikei' ? '事故・災害・犯罪の防止・軽減 － 事故類型の解説' : '事故・災害・犯罪の防止・軽減 － 専門家による注意コメント';
							hasTarget = /<body([^>]*)>/.test(stringData) && /<\/body>/.test(stringData);
							targetHTML = stringData.match(/<body([^>]*)>(.*)<\/body>/)[2];
							bodyID = stringData.match(/<body id="([^>]*)">/);
							bodyID = bodyID ? bodyID[1].trim() : '';
						}
						// 1件分の情報を格納
						record.push(oldPath);
						record.push(newPath);
						record.push(year);
						record.push(type);
						record.push(titleText);
						record.push(bodyID);
						record.push(targetHTML);
						resolve(record);
					});
				}).then((record) => {
					// タブをデリミタとして結果を連結
					tmp.push(record.join('	'));
					__generateConfig(i+1);
				})
			} else {
				resolve(tmp);
			}
		}
		__generateConfig(0);
	});
}

// 実行
const main = async () => {
	sources = await sourceGetter.get( baseDir, {
		ext: 'html',
		exclusion: exclusion
	});
	outputs = await generateConfig();
	fs.outputFile('__conf/config.tsv', outputs.join("\n"), 'utf8');
}

main();