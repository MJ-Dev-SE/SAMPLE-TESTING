import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import PhotoBanner from '../components/PhotoBanner'
import NewsTabs from '../components/NewsTabs'
import BoardColumn from '../components/BoardColumn'
import PopularList from '../components/PopularList'
import { boards } from '../data/home'
import { bannerPhotos } from '../data/photos'

export default function Home() {
  const { t } = useTranslation()

  return (
    <Layout>
      <div className="flex flex-col gap-l">
        {/* 4a. News tab block */}
        <NewsTabs />

        {/* 4b. Room-rate photo banner row — click a card for the full pic + info */}
        <PhotoBanner photos={bannerPhotos} />

        {/* 4c. Board columns ("Latest posts") */}
        <div>
          <h2 className="text-base font-bold text-text-normal mb-s">{t('home.latestPosts')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-l">
            {boards.map((b) => (
              <BoardColumn key={b.boardName.en} board={b} />
            ))}
          </div>
        </div>

        {/* 4d. Popular Posts (Last 30 days) */}
        <PopularList />

        {/*
          Moved to the RIGHT sidebar (per layout): weather/exchange, Business Directory,
          Recently registered businesses, Homepage Statistics.
          Moved to the LEFT sidebar: Login, Recent Comments, Recent photos, Emergency contact.
        */}
      </div>
    </Layout>
  )
}
