/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useEffect } from 'react';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: Post;
  prevPost: Post;
  preview: boolean;
}

export default function Post({
  post: { data, first_publication_date, last_publication_date },
  nextPost = null,
  prevPost = null,
  preview = false,
}: PostProps) {
  let editedData = null;
  if (last_publication_date) {
    editedData = format(
      new Date(last_publication_date),
      "dd MMM yyyy 'às' hh:mm'hrs'",
      {
        locale: ptBR,
      }
    );
  }

  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', true);
    script.setAttribute('repo', 'Bsignx/utterances-space-traveling');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    anchor.appendChild(script);
  }, []);

  const readingTime = data.content.reduce((acc, obj) => {
    const bodyText = RichText.asText(obj.body);

    const textLenght = bodyText.split(/\s/g).length;

    const time = Math.ceil(textLenght / 200);

    return acc + time;
  }, 0);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div className={commonStyles.container}>
        <Header />
      </div>
      <div className={styles.bannerWrapper}>
        <img src={data.banner.url} alt={data.title} />
      </div>
      <div className={commonStyles.container}>
        <h1 className={styles.postTitle}>{data.title}</h1>
        <div className={styles.postDetailsWrapper}>
          <div className={commonStyles.detailwithIconWrapper}>
            <FiCalendar color="#BBBBBB" size={20} />
            <time>
              {format(new Date(first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
          </div>
          <div className={commonStyles.detailwithIconWrapper}>
            <FiUser color="#BBBBBB" size={20} />
            <span>{data.author}</span>
          </div>
          <div className={commonStyles.detailwithIconWrapper}>
            <FiClock color="#BBBBBB" size={20} />
            <span>{readingTime} min</span>
          </div>
        </div>
        {editedData ? (
          <p className={styles.editedData}> * editado em {editedData} </p>
        ) : (
          ''
        )}

        <article className={styles.contentPost}>
          {data.content.map(content => (
            <div key={content.heading + Math.random()}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
        <div className={styles.postEnd}>
          <div className={styles.prevNextPosts}>
            <ul>
              {prevPost ? (
                <li>
                  <h3>{prevPost.data.title}</h3>
                  <Link href={`/post/${prevPost.uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </li>
              ) : (
                <li>
                  <h3> </h3>
                  <Link href="/">
                    <a> </a>
                  </Link>
                </li>
              )}
              {nextPost ? (
                <li>
                  <h3>{nextPost.data.title}</h3>
                  <Link href={`/post/${nextPost.uid}`}>
                    <a>Próximo post</a>
                  </Link>
                </li>
              ) : (
                <li>
                  <h3> </h3>
                  <Link href="/">
                    <a> </a>
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <div id="inject-comments-for-uterances" />
          </div>
          {preview && (
            <aside className={styles.previewMode}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths = async (): GetStaticPaths => {
  const prismic = getPrismicClient();
  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = response.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async ({
  params,
  preview = false,
  previewData,
}): GetStaticProps => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date ?? null,
  };

  const nextResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const prevResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = nextResponse?.results[0] || null;
  const prevPost = prevResponse?.results[0] || null;

  return { props: { post, nextPost, prevPost, preview } };
};
