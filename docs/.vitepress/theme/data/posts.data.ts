import { getAllPostsByCat } from '../../utils'

export default {
  load() {
    return {
      posts: getAllPostsByCat()
    }
  }
}