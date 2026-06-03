import api from './axios'

export const reflectionsApi = {
  createReflection: async (entryId) => {
    const { data } = await api.post(`/reflect/${entryId}`)
    return data
  },
  getReflection: async (entryId) => {
    const { data } = await api.get(`/reflect/${entryId}`)
    return data
  }
}
