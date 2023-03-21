import React, {useContext} from 'react';
import Link from 'next/link';
import {Button, Field, IconPlusSmall, Stack} from 'degen';

import routes from '@/routes';
import {withPublicLayout} from '@/layouts';
import {PageContent, PageHeading, PostsList} from '@/components';
import {Web3Context} from '@/context/web3Context';

const Home = () => {
  const web3 = useContext(Web3Context);

  return (
    <>
      <PageHeading title="Dashboard" />
      <PageContent background="backgroundTertiary">
        <Stack space="9">
          <Link href={routes.entries.create} passHref>
            <Button
              center
              variant="highlight"
              width="full"
              prefix={<IconPlusSmall />}
            >
              Create Entry
            </Button>
          </Link>
          <Field label="Recent posts">
            <PostsList address={web3.address ?? ''} />
          </Field>
        </Stack>
      </PageContent>
    </>
  );
};

export default withPublicLayout(Home);
