export const tldTypes = ['.com', '.org', '.net', '.us', '.xyz'];

// (rounded to nearest whole)
export const FLOOR_TLD_PRICES = {
	'.com': 10,
	'.org': 11,
	'.net': 12,
	'.us': 3,
	'.xyz': 3,
};

/**
 * @typedef {object} Voucher
 * @property {string} code
 * @property {'.com'|'.org'|'.net'|'.us'|'.xyz'} proxy
 */

/**
 *
 * @param {Voucher} voucher
 */
export function validateVoucher(voucher) {
	if ('code' in voucher) {
		if (typeof voucher.code !== 'string') {
			throw new TypeError('Voucher code was not a string');
		}
	}

	if ('tld' in voucher) {
		if (!tldTypes.includes(voucher.tld)) {
			throw new TypeError(
				`Voucher TLD was not one of the following: ${tldTypes}`
			);
		}
	}
}

export default class VoucherWrapper {
	constructor(client) {
		/**
		 * @type {import('pg').Client}
		 */
		this.client = client;
	}
	/**
	 *
	 * @param {string} host
	 * @returns {Promise<Voucher>}
	 */
	async show(code) {
		const {
			rows: [row],
		} = await this.client.query('SELECT * FROM vouchers WHERE code = $1', [
			code,
		]);

		if (row === undefined) {
			throw new RangeError(`Voucher with code ${code} doesn't exist.`);
		}

		return row;
	}
	/**
	 * @returns {Promise<Voucher[]>}
	 */
	async list() {
		const { rows } = await this.client.query('SELECT * FROM vouchers;');

		return rows;
	}
	/**
	 * @param {string} code
	 */
	async delete(code) {
		const { rowCount } = await this.client.query(
			'DELETE FROM vouchers WHERE code = $1;',
			[code]
		);

		return rowCount !== 0;
	}
	/**
	 *
	 * @param {string} tld
	 * @returns {Promise<Voucher>}
	 */
	async create(tld) {
		const voucher = {
			code: Math.random().toString(36).slice(2),
			tld,
		};

		validateVoucher(voucher);

		await this.client.query(
			'INSERT INTO vouchers (code, tld) VALUES ($1, $2);',
			[voucher.code, voucher.tld]
		);

		return voucher;
	}
	/**
	 *
	 * @param {string} code
	 * @param {string} [tld]
	 * @returns {Promise<Voucher}
	 */
	async update(code, tld) {
		let voucher = await this.show(code);

		if (tld === undefined) {
			tld = voucher.tld;
		}

		voucher = {
			code,
			tld,
		};

		validateVoucher(voucher);

		await this.client.query('UPDATE vouchers SET tld = $1 WHERE code = $2', [
			voucher.tld,
			voucher.code,
		]);

		return voucher;
	}
}
