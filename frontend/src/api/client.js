import axios from 'axios'
import { API_CONFIG } from './constants'

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const circuitAPI = {
  /**
   * Simulate a quantum circuit
   * @param {Object} circuit - Circuit data with qubits and gates
   * @returns {Promise<Object>} Simulation results
   */
  simulate: async (circuit) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.SIMULATE, {
      qubits: circuit.qubits,
      gates: circuit.gates,
      shots: circuit.shots || API_CONFIG.ENDPOINTS.SHOTS_DEFAULT,
    })
    return response.data
  },

  /**
   * Get available gates
   * @returns {Promise<Array>} List of available gates
   */
  getGates: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.GATES)
    return response.data
  },

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  health: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.HEALTH)
    return response.data
  },
}

export default api
