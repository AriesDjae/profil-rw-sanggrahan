import { NextResponse } from "next/server";

const halaman = [
  { name: "halaman", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  {
    name: "per_halaman",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
  },
];

const rw = {
  name: "rw",
  in: "query",
  description: "Nomor RW. Konten tingkat kampung ikut tampil.",
  schema: { type: "integer", minimum: 1 },
};

const tanggapan = (keterangan: string, ...kode: number[]) => ({
  200: { description: keterangan },
  ...Object.fromEntries(
    kode.map((k) => [k, { $ref: `#/components/responses/Galat${k}` }]),
  ),
});

const spesifikasi = {
  openapi: "3.1.0",
  info: {
    title: "API Publik Kampung Sanggrahan",
    version: "1.0.0",
    description:
      "API hanya-baca untuk data yang sudah tampil di situs: konten terbit dan laporan kas yang disetujui Ketua RW.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/rw": { get: { summary: "Daftar RW dan RT", responses: tanggapan("Daftar RW") } },
    "/berita": {
      get: {
        summary: "Daftar berita terbit",
        parameters: [
          ...halaman,
          rw,
          { name: "kategori", in: "query", schema: { type: "string" } },
        ],
        responses: tanggapan("Daftar berita", 400, 404),
      },
    },
    "/berita/{slug}": {
      get: {
        summary: "Rincian berita",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: tanggapan("Rincian berita", 404),
      },
    },
    "/kegiatan": {
      get: {
        summary: "Daftar kegiatan",
        parameters: [
          ...halaman,
          rw,
          {
            name: "waktu",
            in: "query",
            schema: { type: "string", enum: ["mendatang", "semua"], default: "semua" },
          },
        ],
        responses: tanggapan("Daftar kegiatan", 400, 404),
      },
    },
    "/keuangan": {
      get: {
        summary: "Ringkasan laporan kas yang disetujui",
        parameters: [
          ...halaman,
          rw,
          { name: "tahun", in: "query", schema: { type: "integer", minimum: 2000, maximum: 2100 } },
        ],
        responses: tanggapan("Daftar laporan", 400, 404),
      },
    },
    "/keuangan/{id}": {
      get: {
        summary: "Rincian laporan kas yang disetujui",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: tanggapan("Rincian laporan", 400, 404),
      },
    },
  },
  components: {
    schemas: {
      Galat: {
        type: "object",
        required: ["galat"],
        properties: {
          galat: {
            type: "object",
            required: ["kode", "pesan"],
            properties: {
              kode: { type: "string" },
              pesan: { type: "string" },
              rincian: {},
            },
          },
        },
      },
    },
    responses: Object.fromEntries(
      [
        [400, "Kueri tidak valid"],
        [404, "Data tidak ditemukan"],
      ].map(([kode, keterangan]) => [
        `Galat${kode}`,
        {
          description: keterangan,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Galat" } } },
        },
      ]),
    ),
  },
};

export function GET() {
  return NextResponse.json(spesifikasi, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
