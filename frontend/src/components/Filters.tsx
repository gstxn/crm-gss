import React, { useEffect, useState } from "react";
import axios from "axios";

export type Especialidade = { id: string; nome: string };
export type Estado = { uf: string; nome: string };
export type Cidade = { id: string; nome: string; uf: string };

export interface Filtros {
  q: string;
  status: string;
  especialidade: string;
  uf: string;
  cidade: string;
}

interface FiltersProps {
  onApply: (filtros: Filtros) => void;
  onReset: () => void;
}

const LOCAL_ESPECIALIDADES: Especialidade[] = [
  { id: "1", nome: "Alergia e Imunologia" },
  { id: "2", nome: "Anestesiologia" },
  { id: "3", nome: "Angiologia" },
  { id: "4", nome: "Cardiologia" },
  { id: "5", nome: "Cirurgia Cardiovascular" },
  { id: "6", nome: "Cirurgia da Mão" },
  { id: "7", nome: "Cirurgia de Cabeça e Pescoço" },
  { id: "8", nome: "Cirurgia do Aparelho Digestivo" },
  { id: "9", nome: "Cirurgia Geral" },
  { id: "10", nome: "Cirurgia Oncológica" },
  { id: "11", nome: "Cirurgia Pediátrica" },
  { id: "12", nome: "Cirurgia Plástica" },
  { id: "13", nome: "Cirurgia Torácica" },
  { id: "14", nome: "Cirurgia Vascular" },
  { id: "15", nome: "Clínica Médica" },
  { id: "16", nome: "Coloproctologia" },
  { id: "17", nome: "Dermatologia" },
  { id: "18", nome: "Endocrinologia e Metabologia" },
  { id: "19", nome: "Endoscopia" },
  { id: "20", nome: "Gastroenterologia" },
  { id: "21", nome: "Genética Médica" },
  { id: "22", nome: "Geriatria" },
  { id: "23", nome: "Ginecologia e Obstetrícia" },
  { id: "24", nome: "Hematologia e Hemoterapia" },
  { id: "25", nome: "Homeopatia" },
  { id: "26", nome: "Infectologia" },
  { id: "27", nome: "Medicina de Emergência" },
  { id: "28", nome: "Medicina de Família e Comunidade" },
  { id: "29", nome: "Medicina do Trabalho" },
  { id: "30", nome: "Medicina Esportiva" },
  { id: "31", nome: "Medicina Física e Reabilitação" },
  { id: "32", nome: "Medicina Intensiva" },
  { id: "33", nome: "Medicina Legal e Perícia Médica" },
  { id: "34", nome: "Medicina Nuclear" },
  { id: "35", nome: "Nefrologia" },
  { id: "36", nome: "Neurocirurgia" },
  { id: "37", nome: "Neurologia" },
  { id: "38", nome: "Nutrologia" },
  { id: "39", nome: "Oftalmologia" },
  { id: "40", nome: "Oncologia Clínica" },
  { id: "41", nome: "Ortopedia e Traumatologia" },
  { id: "42", nome: "Otorrinolaringologia" },
  { id: "43", nome: "Patologia" },
  { id: "44", nome: "Patologia Clínica / Medicina Laboratorial" },
  { id: "45", nome: "Pediatria" },
  { id: "46", nome: "Pneumologia" },
  { id: "47", nome: "Psiquiatria" },
  { id: "48", nome: "Radiologia e Diagnóstico por Imagem" },
  { id: "49", nome: "Radioterapia" },
  { id: "50", nome: "Reumatologia" },
  { id: "51", nome: "Urologia" }
];

const LOCAL_ESTADOS: Estado[] = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" }
];

const LOCAL_CIDADES: Cidade[] = [
  { id: "1", nome: "Itajaí", uf: "SC" },
  { id: "2", nome: "Florianópolis", uf: "SC" },
  { id: "3", nome: "Curitiba", uf: "PR" },
  { id: "4", nome: "Porto Alegre", uf: "RS" }
];

const EMPTY_FILTERS: Filtros = {
  q: "",
  status: "todos",
  especialidade: "todas",
  uf: "todas",
  cidade: "todas"
};

const Filters: React.FC<FiltersProps> = ({ onApply, onReset }) => {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);

  const [filtros, setFiltros] = useState<Filtros>(EMPTY_FILTERS);

  // Carregar dados dos filtros
  useEffect(() => {
    let didCancel = false;
    const fetchFilters = async () => {
      const useLocal = process.env.REACT_APP_USE_LOCAL_FILTERS === "true";
      if (!useLocal) {
        try {
          const { data } = await axios.get<{
            especialidades: Especialidade[];
            estados: Estado[];
            cidades: Cidade[];
          }>("/api/filters");
          if (!didCancel) {
            setEspecialidades(data.especialidades);
            setEstados(data.estados);
            setCidades(data.cidades);
            return;
          }
        } catch (err) {
          console.warn("Falha ao buscar filtros na API, usando fallback local.");
        }
      }
      // Fallback local
      if (!didCancel) {
        setEspecialidades(LOCAL_ESPECIALIDADES);
        setEstados(LOCAL_ESTADOS);
        setCidades(LOCAL_CIDADES);
      }
    };
    fetchFilters();
    return () => {
      didCancel = true;
    };
  }, []);

  // Carregar cidades do IBGE quando UF mudar
  useEffect(() => {
    if (filtros.uf === "todas" || filtros.uf === "") {
      setCidades([]);
      return;
    }
    const fetchCities = async () => {
      try {
        const { data } = await axios.get<any[]>(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filtros.uf}/municipios`
        );
        const lista: Cidade[] = data.map((c) => ({
          id: String(c.id),
          nome: c.nome,
          uf: filtros.uf
        }));
        setCidades(lista);
      } catch (err) {
        console.warn("Falha ao buscar cidades no IBGE", err);
      }
    };
    fetchCities();
  }, [filtros.uf]);

  // Reset cidade quando UF mudar
  useEffect(() => {
    setFiltros((prev) => ({ ...prev, cidade: "todas" }));
  }, [filtros.uf]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const aplicar = () => {
    onApply(filtros);
  };

  const limpar = () => {
    setFiltros(EMPTY_FILTERS);
    onReset();
  };

  return (
    <div className="w-full p-4 bg-white rounded-md shadow-md mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="flex flex-col">
          <label htmlFor="q" className="mb-1 text-sm font-medium">
            Busca
          </label>
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Buscar oportunidades…"
            className="border rounded px-2 py-1"
            value={filtros.q}
            onChange={handleChange}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col">
          <label htmlFor="status" className="mb-1 text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="border rounded px-2 py-1"
            value={filtros.status}
            onChange={handleChange}
          >
            <option value="todos">Todos</option>
            <option value="Aberta">Aberta</option>
            <option value="Em análise">Em análise</option>
            <option value="Fechada">Fechada</option>
          </select>
        </div>

        {/* Especialidade */}
        <div className="flex flex-col">
          <label htmlFor="especialidade" className="mb-1 text-sm font-medium">
            Especialidade
          </label>
          <select
            id="especialidade"
            name="especialidade"
            className="border rounded px-2 py-1"
            value={filtros.especialidade}
            onChange={handleChange}
          >
            <option value="todas">Todas</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.nome}>
                {esp.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="flex flex-col">
          <label htmlFor="uf" className="mb-1 text-sm font-medium">
            Estado
          </label>
          <select
            id="uf"
            name="uf"
            className="border rounded px-2 py-1"
            value={filtros.uf}
            onChange={handleChange}
          >
            <option value="todas">Todos</option>
            {estados.map((est) => (
              <option key={est.uf} value={est.uf}>
                {est.uf} - {est.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Cidade */}
        <div className="flex flex-col">
          <label htmlFor="cidade" className="mb-1 text-sm font-medium">
            Cidade
          </label>
          <select
            id="cidade"
            name="cidade"
            className="border rounded px-2 py-1"
            value={filtros.cidade}
            onChange={handleChange}
            disabled={cidades.length === 0}
          >
            <option value="todas">Todas</option>
            {cidades.map((cid) => (
              <option key={cid.id} value={cid.nome}>
                {cid.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botões */}
      <div className="mt-4 flex gap-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={aplicar}
        >
          Aplicar
        </button>
        <button
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          onClick={limpar}
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

export default Filters;