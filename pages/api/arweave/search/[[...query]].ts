import type {NextApiRequest, NextApiResponse} from 'next';
import ArDB from 'ardb';
import {DataT} from '@/types';

import {initialize} from 'lib/arweave';

const arweave = initialize();
// console.log(arweave);

const getData = async (txId: string) => {
  const buffer = (await arweave.transactions.getData(txId, {
    decode: true,
    string: true,
  })) as string;
  return {
    transactionId: txId,
    buffer: JSON.parse(buffer),
  };
};

export default async function (
  _req: NextApiRequest,
  res: NextApiResponse<DataT[] | string>,
): Promise<any> {
  try {
    const {query} = _req.query;

    // Initialize ArDB
    const ardb = new ArDB(arweave);

    // Build tags
    const tags = [{name: 'App-Name', values: [process.env.APP_NAME as string]}];

    // Retrieve searchAddress
    const searchAddress = query && query[0];

    // Search for transaction withs App-Name and Address (optional) tags
    if (searchAddress) {
      tags.push({name: 'Address', values: [searchAddress]});
    }

    // More information can be found here: https://www.npmjs.com/package/ardb
    const txs = await ardb.search('transactions').tags(tags).limit(10).find();
    // console.log('txs', txs);

    const promises = txs.map((tx: any) => getData(tx._id));
    const data = await Promise.all(promises);

    res.status(200).json(data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
