/* eslint-disable no-return-assign */
import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { FiUser, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination: { results, next_page },
  preview,
}: HomeProps) {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  const loadMorePosts = () => {
    let resultsNextPage;

    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page);
        resultsNextPage = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,

            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
      })
      .then(() => setPosts([...posts, ...resultsNextPage]));
  };

  return (
    <div className={commonStyles.container}>
      <Header />
      <main>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.postWrapper}>
              <article>
                <strong className={styles.postTitle}>{post.data.title}</strong>
                <p className={styles.postSubtitle}>{post.data.subtitle}</p>
                <div className={styles.detailsWrapper}>
                  <div className={commonStyles.detailwithIconWrapper}>
                    <FiCalendar color="#BBBBBB" size={20} />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                  </div>
                  <div className={commonStyles.detailwithIconWrapper}>
                    <FiUser color="#BBBBBB" size={20} />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </article>
            </a>
          </Link>
        ))}
        {!!nextPage && (
          <a href="#a" onClick={loadMorePosts}>
            <p className={styles.loadMorePostsParagraph}>Carregar mais posts</p>
          </a>
        )}
        {preview && (
          <aside className={styles.previewMode}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </div>
  );
}

export const getStaticProps = async ({
  preview = false,
  previewData,
}): GetStaticProps => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.slug',
        'post.title',
        'post.subtitle',
        'post.author',
        'post.banner',
        'post.content',
      ],
      pageSize: 5,
      ref: previewData?.ref ?? null,
    }
  );

  const { next_page } = response;
  const results = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return { props: { postsPagination: { results, next_page }, preview } };
};
