import type {NextApiRequest, NextApiResponse} from 'next';

import {GetTransactionRespT, PostTagsT, TransactionStatusE} from '@/types';
import {MIN_NUMBER_OF_CONFIRMATIONS} from '@/constants';

import {initialize} from 'lib/arweave';

const arweave = initialize();

export default async function (
  req: NextApiRequest,
  res: NextApiResponse<GetTransactionRespT | string>,
): Promise<any> {
  try {
    const {transactionHash} = req.query;

    // Get Arweave transaction data. Documentation can be found here: https://github.com/ArweaveTeam/arweave-js
    const transaction = (await arweave.transactions.getData(
      transactionHash as string,
      {
        decode: true,
        string: true,
      },
    )) as string;

    const transactionJSON = JSON.parse(transaction);

    // Get Arweave transaction status. Documentation can be found here: https://github.com/ArweaveTeam/arweave-js
    const transactionStatusResponse = await arweave.transactions.getStatus(
      transactionHash as string,
    );

    const txStatus =
      transactionStatusResponse.status === 200 &&
      transactionStatusResponse.confirmed &&
      transactionStatusResponse.confirmed?.number_of_confirmations >=
        MIN_NUMBER_OF_CONFIRMATIONS
        ? TransactionStatusE.CONFIRMED
        : TransactionStatusE.NOT_CONFIRMED;

    if (txStatus === TransactionStatusE.CONFIRMED) {
      // Get Arweave transaction. Documentation can be found here: https://github.com/ArweaveTeam/arweave-js
      const tx = await arweave.transactions.get(transactionHash as string);

      // Get Arweave transaction tags. Documentation can be found here: https://github.com/ArweaveTeam/arweave-js
      const tags = {} as PostTagsT;
      (tx.get('tags') as any).forEach((tag) => {
        const key = tag.get('name', {decode: true, string: true});
        tags[key] = tag.get('value', {decode: true, string: true});
      });

      // Get Arweave transaction block in order to retrieve timestamp. Documentation can be found here: https://github.com/ArweaveTeam/arweave-js
      const block = transactionStatusResponse.confirmed
        ? await arweave.blocks.get(
            transactionStatusResponse.confirmed.block_indep_hash,
          )
        : null;

      // Return JSON response in form:
      res.status(200).json({
        id: transactionHash as string,
        data: transactionJSON,
        status: txStatus,
        timestamp: block?.timestamp,
        tags,
      });
    } else {
      res.status(200).json({
        id: transactionHash as string,
        data: transactionJSON,
        status: txStatus,
      });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
