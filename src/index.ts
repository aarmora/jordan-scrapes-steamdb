import puppeteer, { Page } from 'puppeteer';
import { getPropertyBySelector } from 'puppeteer-helpers';
import * as json2csv from 'json2csv';
import * as fs from 'fs';

(async () => {

	await doItWithPuppeteer();


})();

export async function doItWithPuppeteer() {

	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	const domain = 'https://steamdb.info';

	await page.goto(`${domain}/search/?a=app&q=&type=1&category=666`);

	await page.waitForSelector('tr.app');


	await page.select('#table-sortable_length select', '-1');
	const apps = await page.$$('tr.app');

	console.log('apps length', apps.length);

	const appsInfo: any[] = [];
	for (let app of apps) {

		const url = await getPropertyBySelector(app, 'a', 'href');
		const name = await getPropertyBySelector(app, 'td:nth-of-type(3)', 'innerHTML');

		appsInfo.push({
			url: url,
			name: name
		});
	}

	for (let app of appsInfo) {
		try {
			await handleDepots(app, page);
		}
		catch (e) {
			console.log('error handling the depots', e);
		}
	}

	const csv = json2csv.parse(appsInfo);

	fs.writeFile('steamApps.csv', csv, async (err) => {
		if (err) {
			console.log('err while saving file', err);
		}
	});

	await browser.close();

	console.log('apps after all', appsInfo[23], appsInfo[2500], appsInfo.length);
}

export async function handleDepots(app: any, page: Page) {
	await page.goto(`${app.url}depots/`);

	const table = await page.$('#depots table:first-of-type tbody');

	if (!table) {
		return Promise.resolve();
	}
	const depots = await table.$$('tr');

	console.log('depots length', depots.length);

	for (let i = 0; i < depots.length; i++) {


		const depotSize = await depots[i].$eval('[data-sort]', elem => elem.textContent);
		const actualDepotSize = await depots[i].$eval('[data-sort]', elem => elem.getAttribute('data-sort'));
		const depotName = await getPropertyBySelector(depots[i], 'td:nth-of-type(2)', 'innerHTML');

		const macRow = await depots[i].$('.icon-macos');


		if (!macRow) {
			app[`depot${i + 1}Size`] = depotSize;
			app[`depot${i + 1}ActualSize`] = actualDepotSize;
			app[`depot${i + 1}Name`] = depotName;
		}
	}

}