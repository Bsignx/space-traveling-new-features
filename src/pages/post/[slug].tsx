/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({
  post: { data, first_publication_date },
}: PostProps) {
  const router = useRouter();

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
        <div className={styles.contentPost}>
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
        </div>
      </div>
    </>
  );
}

export const getStaticPaths = async () => {
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

export const getStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

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
  };

  return { props: { post } };
};
