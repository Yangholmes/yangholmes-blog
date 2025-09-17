import { getAllCategories } from '../../utils'

export default {
  load() {
    return {
      categories: getAllCategories()
    }
  }
}