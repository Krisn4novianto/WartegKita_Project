import {
  User,
  ShoppingBag,
  MapPin,
  LogOut,
  Plus,
  Edit3,
} from "lucide-react";


import {
  useEffect,
  useState,
} from "react";


import {
  useNavigate,
} from "react-router-dom";


import Swal from "sweetalert2";


import api from "../../services/api";


import {
  getProvinces,
  getCities,
  getDistricts,
  Wilayah,
} from "../../services/wilayahApi";


import "../../styles/profile.css";


interface UserProfile {
  id: number;
  name: string;
  email: string;
}



interface Address {
  label: string;
  detail: string;

  province: string;
  provinceId: number | "";

  city: string;
  cityId: number | "";

  district: string;
  districtId: number | "";

  postalCode: string;
  note: string;
}



const emptyAddress: Address = {
  label: "Rumah",

  detail: "",

  province: "",
  provinceId: "",

  city: "",
  cityId: "",

  district: "",
  districtId: "",

  postalCode: "",

  note: "",
};



export default function Profile() {

  const navigate = useNavigate();


  const [user, setUser] =
    useState<UserProfile | null>(null);


  const [editProfile, setEditProfile] =
    useState(false);


  const [name, setName] =
    useState("");


  const [email, setEmail] =
    useState("");


  const [showEditAddress, setShowEditAddress] =
    useState(false);


  const [savedAddress, setSavedAddress] =
    useState<Address | null>(null);


  const [address, setAddress] =
    useState<Address>(emptyAddress);


  const [provinces, setProvinces] =
    useState<Wilayah[]>([]);


  const [cities, setCities] =
    useState<Wilayah[]>([]);


  const [districts, setDistricts] =
    useState<Wilayah[]>([]);



  useEffect(() => {

    async function init() {

      try {

        const provinceData =
          await getProvinces();


        setProvinces(provinceData);


        await loadUser();

        await loadAddress();


      } catch (err) {

        console.log(err);

      }

    }


    init();

  }, []);





  async function loadUser() {

    try {

      const response =
        await api.get(
          "/users/profile?user_id=1"
        );


      const data =
        response.data.data ??
        response.data;


      setUser(data);


      setName(
        data.name
      );


      setEmail(
        data.email
      );


    } catch (err) {

      console.log(
        "user error",
        err
      );

    }

  }




  async function updateUser() {

    try {

      await api.put(
        "/users/profile",
        {
          user_id: 1,
          name,
          email,
        }
      );


      await loadUser();


      setEditProfile(false);


      Swal.fire({
        title: "Berhasil",
        text: "Profil berhasil diperbarui",
        icon: "success",
        confirmButtonColor: "#16a34a",
      });


    } catch (err) {

      console.log(err);


      Swal.fire({
        title: "Gagal",
        text: "Profil gagal diperbarui",
        icon: "error",
      });

    }

  }


  async function loadAddress() {

    try {

      const response =
        await api.get(
          "/users/address?user_id=1"
        );


      const raw =
        response.data.data ??
        response.data;


      const data =
        Array.isArray(raw)
          ? raw[0]
          : raw;



      if (!data) {

        setSavedAddress(null);

        setAddress({ ...emptyAddress });

        return;

      }



      const result: Address = {

        label:
          data.label ??
          "Rumah",


        detail:
          data.detail ??
          "",


        province:
          data.province_name ??
          "",


        provinceId:
          data.province_id ??
          "",


        city:
          data.city_name ??
          "",


        cityId:
          data.city_id ??
          "",


        district:
          data.district_name ??
          "",


        districtId:
          data.district_id ??
          "",


        postalCode:
          data.postal_code ??
          "",


        note:
          data.note ??
          "",

      };



      setSavedAddress(result);

      setAddress(result);




      if (result.provinceId) {

        const cityData =
          await getCities(
            result.provinceId
          );


        setCities(cityData);

      }





      if (result.cityId) {

        const districtData =
          await getDistricts(
            result.cityId
          );


        setDistricts(districtData);

      }



    } catch (err) {

      console.log(
        "address error",
        err
      );

    }

  }






  function updateAddress(
    value: Partial<Address>
  ) {

    setAddress(prev => ({
      ...prev,
      ...value,
    }));

  }







  async function chooseProvince(
    value: string
  ) {


    const provinceId =
      Number(value);



    const selected =
      provinces.find(
        item =>
          item.id === provinceId
      );



    updateAddress({

      provinceId,

      province:
        selected?.name ?? "",


      city: "",
      cityId: "",


      district: "",
      districtId: "",


      postalCode: "",

    });



    setCities([]);

    setDistricts([]);




    const cityData =
      await getCities(
        provinceId
      );



    setCities(cityData);

  }









  async function chooseCity(
    value: string
  ) {


    const cityId =
      Number(value);



    const selected =
      cities.find(
        item =>
          item.id === cityId
      );



    updateAddress({

      cityId,

      city:
        selected?.name ?? "",


      district: "",
      districtId: "",


      postalCode: "",

    });



    setDistricts([]);




    const districtData =
      await getDistricts(
        cityId
      );



    setDistricts(districtData);

  }








  function chooseDistrict(
    value: string
  ) {


    const districtId =
      Number(value);



    const selected =
      districts.find(
        item =>
          item.id === districtId
      );



    updateAddress({

      districtId,

      district:
        selected?.name ?? "",

    });

  }









  async function saveAddress() {


    if (
      !address.detail ||
      !address.province ||
      !address.city ||
      !address.district
    ) {


      Swal.fire({

        title:
          "Alamat belum lengkap",


        text:
          "Lengkapi alamat terlebih dahulu",


        icon:
          "warning",


        confirmButtonColor:
          "#16a34a",

      });


      return;

    }





    try {


      await api.post(
        "/users/address",
        {

          user_id: 1,


          label:
            address.label,


          detail:
            address.detail,



          province_id:
            address.provinceId,


          province_name:
            address.province,



          city_id:
            address.cityId,


          city_name:
            address.city,



          district_id:
            address.districtId,


          district_name:
            address.district,



          postal_code:
            address.postalCode,


          note:
            address.note,

        }
      );





      await loadAddress();



      setShowEditAddress(false);




      Swal.fire({

        title:
          "Berhasil",


        text:
          "Alamat berhasil disimpan",


        icon:
          "success",


        confirmButtonColor:
          "#16a34a",

      });




    } catch (err) {


      console.log(err);



      Swal.fire({

        title:
          "Gagal",


        text:
          "Alamat gagal disimpan",


        icon:
          "error",

      });


    }


  }

  function logout() {

    localStorage.removeItem(
      "token"
    );


    navigate(
      "/login"
    );

  }





  return (

    <div className="profile-page">

      <div className="profile-container">


        <div className="profile-header">

          <h1>
            Profil Saya
          </h1>


          <p>
            Kelola informasi akun dan alamat pengiriman
          </p>

        </div>





        <div className="profile-card">


          <div className="profile-avatar">

            {
              user?.name
                ?.charAt(0)
                .toUpperCase()
            }

          </div>



          <div className="profile-badge">

            <User size={16} />

            Customer

          </div>


          <div className="profile-info">
            {
              editProfile ? (

                <div className="profile-edit">


                  <input

                    value={name}

                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }

                    placeholder="Nama"

                  />



                  <input

                    value={email}

                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }

                    placeholder="Email"

                  />



                  <button

                    type="button"

                    onClick={updateUser}

                  >

                    Simpan

                  </button>


                </div>


              ) : (

                <>

                  <h2>
                    {user?.name || "Nama User"}
                  </h2>


                  <div className="profile-email">
                    {user?.email || "email@example.com"}
                  </div>






                  <button

                    className="edit-profile"

                    type="button"

                    onClick={() => {

                      setName(
                        user?.name ?? ""
                      );


                      setEmail(
                        user?.email ?? ""
                      );


                      setEditProfile(true);

                    }}

                  >

                    <Edit3 size={16} />

                    Edit Profil

                  </button>



                </>

              )

            }


          </div>





          <div className="profile-menu">



            <button

              type="button"

              onClick={() =>
                navigate("/orders")
              }

            >

              <ShoppingBag />

              <div>

                <strong>
                  Pesanan Saya
                </strong>


                <span>
                  Lihat riwayat pesanan
                </span>


              </div>


            </button>






            <div className="address-box">


              <div className="address-header">


                <MapPin />


                <div>

                  <strong>
                    Alamat Pengiriman
                  </strong>


                  <span>
                    Alamat untuk pesanan kamu
                  </span>


                </div>


              </div>

              {
                !showEditAddress ? (

                  savedAddress ? (

                    <div className="saved-address">

                      <div>

                        <strong>
                          {savedAddress.label}
                        </strong>

                        <p>
                          {savedAddress.detail}
                        </p>

                        <span>
                          {savedAddress.district}, {savedAddress.city}
                        </span>

                        <br />

                        <span>
                          {savedAddress.province}
                          {savedAddress.postalCode &&
                            ` - ${savedAddress.postalCode}`}
                        </span>

                        {savedAddress.note && (
                          <p>{savedAddress.note}</p>
                        )}

                      </div>

                      <button
                        type="button"
                        className="edit-address"
                        onClick={() => {
                          setAddress(savedAddress);
                          setShowEditAddress(true);
                        }}
                      >
                        <Edit3 size={16} />
                        Ubah
                      </button>

                    </div>

                  ) : (

                    <button
                      type="button"
                      className="add-address-btn"
                      onClick={() => {
                        setAddress({ ...emptyAddress });
                        setShowEditAddress(true);
                      }}
                    >
                      <Plus size={18} />
                      Tambah Alamat
                    </button>

                  )

                ) : (

                  <div className="address-form">





                    <div className="address-type">


                      {
                        [
                          "Rumah",
                          "Kantor",
                          "Kos",
                          "Lainnya",
                        ].map(item => (

                          <button

                            key={item}

                            type="button"

                            className={
                              address.label === item
                                ? "active"
                                : ""
                            }


                            onClick={() =>
                              updateAddress({
                                label: item,
                              })
                            }

                          >

                            {item}

                          </button>


                        ))

                      }


                    </div>






                    <textarea

                      placeholder="Alamat lengkap"

                      value={
                        address.detail
                      }

                      onChange={(e) =>
                        updateAddress({
                          detail:
                            e.target.value,
                        })
                      }

                    />









                    <select

                      value={
                        address.provinceId
                      }

                      onChange={(e) =>
                        chooseProvince(
                          e.target.value
                        )
                      }

                    >

                      <option value="">

                        Pilih Provinsi

                      </option>



                      {
                        provinces.map(item => (

                          <option

                            key={item.id}

                            value={item.id}

                          >

                            {item.name}

                          </option>


                        ))

                      }


                    </select>








                    <select

                      value={
                        address.cityId
                      }

                      onChange={(e) =>
                        chooseCity(
                          e.target.value
                        )
                      }

                    >

                      <option value="">

                        Pilih Kabupaten/Kota

                      </option>




                      {
                        cities.map(item => (

                          <option

                            key={item.id}

                            value={item.id}

                          >

                            {item.name}

                          </option>


                        ))

                      }


                    </select>








                    <select

                      value={
                        address.districtId
                      }

                      onChange={(e) =>
                        chooseDistrict(
                          e.target.value
                        )
                      }

                    >


                      <option value="">

                        Pilih Kecamatan

                      </option>





                      {
                        districts.map(item => (

                          <option

                            key={item.id}

                            value={item.id}

                          >

                            {item.name}

                          </option>


                        ))

                      }


                    </select>








                    <input

                      placeholder="Kode Pos"

                      value={
                        address.postalCode
                      }

                      onChange={(e) =>
                        updateAddress({
                          postalCode:
                            e.target.value,
                        })
                      }

                    />








                    <textarea

                      placeholder="Catatan kurir"

                      value={
                        address.note
                      }

                      onChange={(e) =>
                        updateAddress({
                          note:
                            e.target.value,
                        })
                      }

                    />



                    <div className="address-actions">
                      <button
                        type="button"
                        className="save-address"
                        onClick={saveAddress}
                      >
                        Simpan
                      </button>

                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setAddress(savedAddress ?? { ...emptyAddress });
                          setShowEditAddress(false);
                        }}
                      >
                        Batal
                      </button>
                    </div>



                  </div>


                )

              }



            </div>



          </div>







          <button

            type="button"

            className="logout-button"

            onClick={logout}

          >

            <LogOut size={20} />

            Logout


          </button>





        </div>


      </div>


    </div>


  );

}