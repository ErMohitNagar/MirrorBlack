import api from './axios'

export const entriesApi = {
  getEntries: async (page = 1) => {
    const { data } = await api.get(`/entries?page=${page}`)
    return data
  },
  getEntry: async (id) => {
    const { data } = await api.get(`/entries/${id}`)
    return data
  },
  createEntry: async (content) => {
    const { data } = await api.post('/entries', { content })
    return data
  },
  updateEntry: async (id, content) => {
    const { data } = await api.patch(`/entries/${id}`, { content })
    return data
  },
  deleteEntry: async (id) => {
    const { data } = await api.delete(`/entries/${id}`)
    return data
  }
}
