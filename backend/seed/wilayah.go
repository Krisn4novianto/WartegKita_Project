package seed

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

//  Struct models untuk tabel wilayah 

type Province struct {
	ID   int    `gorm:"primaryKey;autoIncrement:false"`
	Name string `gorm:"size:100;not null"`
}

type City struct {
	ID         int    `gorm:"primaryKey;autoIncrement:false"`
	ProvinceID int    `gorm:"not null;index"`
	Name       string `gorm:"size:100;not null"`
}

type District struct {
	ID     int    `gorm:"primaryKey;autoIncrement:false"`
	CityID int    `gorm:"not null;index"`
	Name   string `gorm:"size:100;not null"`
}

//  Data Provinsi Indonesia (34 provinsi) 

var provinces = []Province{
	{1, "Aceh"},
	{2, "Sumatera Utara"},
	{3, "Sumatera Barat"},
	{4, "Riau"},
	{5, "Jambi"},
	{6, "Sumatera Selatan"},
	{7, "Bengkulu"},
	{8, "Lampung"},
	{9, "Kepulauan Bangka Belitung"},
	{10, "Kepulauan Riau"},
	{11, "DKI Jakarta"},
	{12, "Jawa Barat"},
	{13, "Jawa Tengah"},
	{14, "DI Yogyakarta"},
	{15, "Jawa Timur"},
	{16, "Banten"},
	{17, "Bali"},
	{18, "Nusa Tenggara Barat"},
	{19, "Nusa Tenggara Timur"},
	{20, "Kalimantan Barat"},
	{21, "Kalimantan Tengah"},
	{22, "Kalimantan Selatan"},
	{23, "Kalimantan Timur"},
	{24, "Kalimantan Utara"},
	{25, "Sulawesi Utara"},
	{26, "Sulawesi Tengah"},
	{27, "Sulawesi Selatan"},
	{28, "Sulawesi Tenggara"},
	{29, "Gorontalo"},
	{30, "Sulawesi Barat"},
	{31, "Maluku"},
	{32, "Maluku Utara"},
	{33, "Papua Barat"},
	{34, "Papua"},
}

//  Data Kota/Kabupaten (sample: kota-kota utama per provinsi) 

var cities = []City{
	// DKI Jakarta (11)
	{1101, 11, "Jakarta Pusat"},
	{1102, 11, "Jakarta Utara"},
	{1103, 11, "Jakarta Barat"},
	{1104, 11, "Jakarta Selatan"},
	{1105, 11, "Jakarta Timur"},

	// Jawa Barat (12)
	{1201, 12, "Kota Bandung"},
	{1202, 12, "Kota Bekasi"},
	{1203, 12, "Kota Depok"},
	{1204, 12, "Kota Bogor"},
	{1205, 12, "Kabupaten Karawang"},
	{1206, 12, "Kabupaten Bekasi"},
	{1207, 12, "Kabupaten Bogor"},
	{1208, 12, "Kabupaten Bandung"},
	{1209, 12, "Kota Cimahi"},
	{1210, 12, "Kota Tasikmalaya"},

	// Jawa Tengah (13)
	{1301, 13, "Kota Semarang"},
	{1302, 13, "Kota Solo"},
	{1303, 13, "Kota Magelang"},
	{1304, 13, "Kabupaten Klaten"},
	{1305, 13, "Kabupaten Banyumas"},
	{1306, 13, "Kabupaten Cilacap"},
	{1307, 13, "Kabupaten Brebes"},
	{1308, 13, "Kota Tegal"},
	{1309, 13, "Kabupaten Pati"},
	{1310, 13, "Kabupaten Kudus"},

	// DI Yogyakarta (14)
	{1401, 14, "Kota Yogyakarta"},
	{1402, 14, "Kabupaten Sleman"},
	{1403, 14, "Kabupaten Bantul"},
	{1404, 14, "Kabupaten Gunung Kidul"},
	{1405, 14, "Kabupaten Kulon Progo"},

	// Jawa Timur (15)
	{1501, 15, "Kota Surabaya"},
	{1502, 15, "Kota Malang"},
	{1503, 15, "Kota Sidoarjo"},
	{1504, 15, "Kota Mojokerto"},
	{1505, 15, "Kota Kediri"},
	{1506, 15, "Kabupaten Gresik"},
	{1507, 15, "Kabupaten Jember"},
	{1508, 15, "Kabupaten Banyuwangi"},
	{1509, 15, "Kabupaten Pasuruan"},
	{1510, 15, "Kabupaten Tuban"},

	// Banten (16)
	{1601, 16, "Kota Tangerang"},
	{1602, 16, "Kota Tangerang Selatan"},
	{1603, 16, "Kota Serang"},
	{1604, 16, "Kota Cilegon"},
	{1605, 16, "Kabupaten Tangerang"},

	// Sumatera Utara (2)
	{201, 2, "Kota Medan"},
	{202, 2, "Kota Binjai"},
	{203, 2, "Kota Pematangsiantar"},
	{204, 2, "Kabupaten Deli Serdang"},
	{205, 2, "Kabupaten Langkat"},

	// Sumatera Selatan (6)
	{601, 6, "Kota Palembang"},
	{602, 6, "Kabupaten Banyuasin"},
	{603, 6, "Kota Lubuklinggau"},

	// Riau (4)
	{401, 4, "Kota Pekanbaru"},
	{402, 4, "Kota Dumai"},
	{403, 4, "Kabupaten Kampar"},

	// Sulawesi Selatan (27)
	{2701, 27, "Kota Makassar"},
	{2702, 27, "Kota Parepare"},
	{2703, 27, "Kabupaten Gowa"},
	{2704, 27, "Kabupaten Bone"},

	// Bali (17)
	{1701, 17, "Kota Denpasar"},
	{1702, 17, "Kabupaten Badung"},
	{1703, 17, "Kabupaten Gianyar"},
	{1704, 17, "Kabupaten Tabanan"},
	{1705, 17, "Kabupaten Buleleng"},

	// Kalimantan Timur (23)
	{2301, 23, "Kota Samarinda"},
	{2302, 23, "Kota Balikpapan"},
	{2303, 23, "Kota Bontang"},

	// Kalimantan Selatan (22)
	{2201, 22, "Kota Banjarmasin"},
	{2202, 22, "Kota Banjarbaru"},

	// Aceh (1)
	{101, 1, "Kota Banda Aceh"},
	{102, 1, "Kota Sabang"},
	{103, 1, "Kabupaten Aceh Besar"},
}

//  Data Kecamatan (sample: beberapa kecamatan per kota utama) 

var districts = []District{
	// Jakarta Pusat (1101)
	{110101, 1101, "Gambir"},
	{110102, 1101, "Sawah Besar"},
	{110103, 1101, "Kemayoran"},
	{110104, 1101, "Senen"},
	{110105, 1101, "Cempaka Putih"},
	{110106, 1101, "Menteng"},
	{110107, 1101, "Tanah Abang"},
	{110108, 1101, "Johar Baru"},

	// Jakarta Selatan (1104)
	{110401, 1104, "Jagakarsa"},
	{110402, 1104, "Pasar Minggu"},
	{110403, 1104, "Cilandak"},
	{110404, 1104, "Pesanggrahan"},
	{110405, 1104, "Kebayoran Lama"},
	{110406, 1104, "Kebayoran Baru"},
	{110407, 1104, "Mampang Prapatan"},
	{110408, 1104, "Pancoran"},
	{110409, 1104, "Tebet"},
	{110410, 1104, "Setiabudi"},

	// Jakarta Barat (1103)
	{110301, 1103, "Cengkareng"},
	{110302, 1103, "Grogol Petamburan"},
	{110303, 1103, "Tambora"},
	{110304, 1103, "Taman Sari"},
	{110305, 1103, "Palmerah"},
	{110306, 1103, "Kebon Jeruk"},
	{110307, 1103, "Kembangan"},
	{110308, 1103, "Kalideres"},

	// Jakarta Timur (1105)
	{110501, 1105, "Matraman"},
	{110502, 1105, "Pulogadung"},
	{110503, 1105, "Jatinegara"},
	{110504, 1105, "Kramat Jati"},
	{110505, 1105, "Cakung"},
	{110506, 1105, "Duren Sawit"},
	{110507, 1105, "Pasar Rebo"},
	{110508, 1105, "Cipayung"},
	{110509, 1105, "Ciracas"},
	{110510, 1105, "Makasar"},

	// Jakarta Utara (1102)
	{110201, 1102, "Penjaringan"},
	{110202, 1102, "Pademangan"},
	{110203, 1102, "Tanjung Priok"},
	{110204, 1102, "Koja"},
	{110205, 1102, "Kelapa Gading"},
	{110206, 1102, "Cilincing"},

	// Kota Bandung (1201)
	{120101, 1201, "Sukasari"},
	{120102, 1201, "Sukajadi"},
	{120103, 1201, "Cicendo"},
	{120104, 1201, "Andir"},
	{120105, 1201, "Bojongloa Kaler"},
	{120106, 1201, "Astanaanyar"},
	{120107, 1201, "Babakan Ciparay"},
	{120108, 1201, "Bandung Kulon"},
	{120109, 1201, "Coblong"},
	{120110, 1201, "Cibeunying Kaler"},

	// Kota Semarang (1301)
	{130101, 1301, "Semarang Tengah"},
	{130102, 1301, "Semarang Utara"},
	{130103, 1301, "Semarang Timur"},
	{130104, 1301, "Semarang Barat"},
	{130105, 1301, "Semarang Selatan"},
	{130106, 1301, "Gayamsari"},
	{130107, 1301, "Genuk"},
	{130108, 1301, "Pedurungan"},

	// Kota Yogyakarta (1401)
	{140101, 1401, "Danurejan"},
	{140102, 1401, "Gedongtengen"},
	{140103, 1401, "Gondokusuman"},
	{140104, 1401, "Gondomanan"},
	{140105, 1401, "Jetis"},
	{140106, 1401, "Kotagede"},
	{140107, 1401, "Kraton"},
	{140108, 1401, "Mantrijeron"},
	{140109, 1401, "Mergangsan"},
	{140110, 1401, "Ngampilan"},
	{140111, 1401, "Pakualaman"},
	{140112, 1401, "Tegalrejo"},
	{140113, 1401, "Umbulharjo"},
	{140114, 1401, "Wirobrajan"},

	// Kota Surabaya (1501)
	{150101, 1501, "Genteng"},
	{150102, 1501, "Bubutan"},
	{150103, 1501, "Simokerto"},
	{150104, 1501, "Pabean Cantian"},
	{150105, 1501, "Semampir"},
	{150106, 1501, "Krembangan"},
	{150107, 1501, "Kenjeran"},
	{150108, 1501, "Bulak"},
	{150109, 1501, "Tambaksari"},
	{150110, 1501, "Gubeng"},

	// Kota Makassar (2701)
	{270101, 2701, "Makassar"},
	{270102, 2701, "Ujung Pandang"},
	{270103, 2701, "Wajo"},
	{270104, 2701, "Bontoala"},
	{270105, 2701, "Tallo"},
	{270106, 2701, "Rappocini"},
	{270107, 2701, "Panakkukang"},
	{270108, 2701, "Tamalanrea"},

	// Kota Denpasar (1701)
	{170101, 1701, "Denpasar Barat"},
	{170102, 1701, "Denpasar Timur"},
	{170103, 1701, "Denpasar Selatan"},
	{170104, 1701, "Denpasar Utara"},

	// Kota Tangerang (1601)
	{160101, 1601, "Ciledug"},
	{160102, 1601, "Larangan"},
	{160103, 1601, "Karang Tengah"},
	{160104, 1601, "Cipondoh"},
	{160105, 1601, "Batuceper"},
	{160106, 1601, "Benda"},
	{160107, 1601, "Tangerang"},
	{160108, 1601, "Karawaci"},

	// Kota Tangerang Selatan (1602)
	{160201, 1602, "Pondok Aren"},
	{160202, 1602, "Ciputat"},
	{160203, 1602, "Ciputat Timur"},
	{160204, 1602, "Pamulang"},
	{160205, 1602, "Serpong"},
	{160206, 1602, "Serpong Utara"},
	{160207, 1602, "Setu"},

	// Kota Bekasi (1202)
	{120201, 1202, "Bekasi Barat"},
	{120202, 1202, "Bekasi Selatan"},
	{120203, 1202, "Bekasi Timur"},
	{120204, 1202, "Bekasi Utara"},
	{120205, 1202, "Pondok Gede"},
	{120206, 1202, "Jatisampurna"},
	{120207, 1202, "Pondok Melati"},
	{120208, 1202, "Jatiasih"},
	{120209, 1202, "Bantargebang"},
	{120210, 1202, "Mustika Jaya"},
	{120211, 1202, "Medansatria"},
	{120212, 1202, "Rawalumbu"},
}

//  Seeder 

func SeedWilayah(db *gorm.DB) {
	// 1. AutoMigrate tabel wilayah
	if err := db.AutoMigrate(&Province{}, &City{}, &District{}); err != nil {
		log.Fatalf("seed: gagal migrate tabel wilayah: %v", err)
	}

	// 2. Seed provinces
	var provCount int64
	db.Model(&Province{}).Count(&provCount)
	if provCount == 0 {
		if err := db.CreateInBatches(provinces, 50).Error; err != nil {
			log.Fatalf("seed: gagal insert provinces: %v", err)
		}
		fmt.Printf(" Seeded %d provinces\n", len(provinces))
	} else {
		log.Println("  provinces: sudah ada data, skip")
	}

	// 3. Seed cities
	var cityCount int64
	db.Model(&City{}).Count(&cityCount)
	if cityCount == 0 {
		if err := db.CreateInBatches(cities, 100).Error; err != nil {
			log.Fatalf("seed: gagal insert cities: %v", err)
		}
		fmt.Printf(" Seeded %d cities\n", len(cities))
	} else {
		log.Println("  cities: sudah ada data, skip")
	}

	// 4. Seed districts
	var distCount int64
	db.Model(&District{}).Count(&distCount)
	if distCount == 0 {
		if err := db.CreateInBatches(districts, 200).Error; err != nil {
			log.Fatalf("seed: gagal insert districts: %v", err)
		}
		fmt.Printf(" Seeded %d districts\n", len(districts))
	} else {
		log.Println("  districts: sudah ada data, skip")
	}
}
