import Categories from './home/Categories'
import Swiper from './home/Swiper'
import Trending from './home/Trending'

function Home() {
    return (
        <div>
            <Swiper />
            <Categories/>
            <Trending/>
        </div>
    )
}

export default Home