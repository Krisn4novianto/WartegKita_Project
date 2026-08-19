import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    CircleAlert,
    CheckCircle2,
    Store,
    Phone,
    MapPin,
    CreditCard,
    Upload,
    X,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
} from "lucide-react";

import api from "../../services/api";

import "../../styles/auth.css";

import WartegKitaLogo
    from "../../assets/images/WartegKita.png";


type AccountType =
    | "customer"
    | "seller";


export default function Register() {

    const navigate = useNavigate();

    const ktpInputRef =
        useRef<HTMLInputElement | null>(null);


    // =====================================================
    // STEP
    // =====================================================

    const [step, setStep] =
        useState<number>(1);


    // =====================================================
    // ACCOUNT TYPE
    // =====================================================

    const [accountType, setAccountType] =
        useState<AccountType>("customer");


    // =====================================================
    // BASIC ACCOUNT
    // =====================================================

    const [name, setName] =
        useState<string>("");

    const [email, setEmail] =
        useState<string>("");

    const [password, setPassword] =
        useState<string>("");

    const [confirmPassword, setConfirmPassword] =
        useState<string>("");


    // =====================================================
    // SELLER BUSINESS
    // =====================================================

    const [namaWarteg, setNamaWarteg] =
        useState<string>("");

    const [nomorHP, setNomorHP] =
        useState<string>("");

    const [alamat, setAlamat] =
        useState<string>("");


    // =====================================================
    // SELLER IDENTITY
    // =====================================================

    const [ktpNumber, setKtpNumber] =
        useState<string>("");

    const [ktpFile, setKtpFile] =
        useState<File | null>(null);

    const [ktpPreview, setKtpPreview] =
        useState<string>("");


    // =====================================================
    // UI STATE
    // =====================================================

    const [showPassword, setShowPassword] =
        useState<boolean>(false);

    const [showConfirm, setShowConfirm] =
        useState<boolean>(false);

    const [loading, setLoading] =
        useState<boolean>(false);

    const [error, setError] =
        useState<string>("");

    const [success, setSuccess] =
        useState<boolean>(false);


    // =====================================================
    // CLEANUP KTP PREVIEW
    // =====================================================

    useEffect(() => {

        return () => {

            if (ktpPreview) {

                URL.revokeObjectURL(
                    ktpPreview
                );
            }
        };

    }, [ktpPreview]);


    // =====================================================
    // RESET FORM
    // =====================================================

    function resetForm() {

        setStep(1);

        setAccountType("customer");

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setNamaWarteg("");
        setNomorHP("");
        setAlamat("");

        setKtpNumber("");
        setKtpFile(null);
        setKtpPreview("");

        setShowPassword(false);
        setShowConfirm(false);

        setLoading(false);
        setError("");
        setSuccess(false);

        if (ktpInputRef.current) {

            ktpInputRef.current.value = "";
        }
    }


    // =====================================================
    // SELECT ACCOUNT TYPE
    // =====================================================

    function handleAccountType(
        type: AccountType
    ) {

        if (loading) {
            return;
        }

        setAccountType(type);

        setError("");

        /*
         * Ketika user memilih tipe akun,
         * kembali ke step pertama.
         */
        setStep(1);
    }


    // =====================================================
    // VALIDATE BASIC ACCOUNT
    // =====================================================

    function validateAccountStep(): boolean {

        setError("");

        const cleanName =
            name.trim();

        const cleanEmail =
            email.trim().toLowerCase();


        // -------------------------------------------------
        // NAME
        // -------------------------------------------------

        if (!cleanName) {

            setError(
                "Nama lengkap wajib diisi."
            );

            return false;
        }


        if (cleanName.length < 2) {

            setError(
                "Nama lengkap minimal 2 karakter."
            );

            return false;
        }


        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        if (!cleanEmail) {

            setError(
                "Email wajib diisi."
            );

            return false;
        }


        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !emailRegex.test(
                cleanEmail
            )
        ) {

            setError(
                "Format email tidak valid."
            );

            return false;
        }


        // -------------------------------------------------
        // PASSWORD
        // -------------------------------------------------

        if (!password) {

            setError(
                "Password wajib diisi."
            );

            return false;
        }


        if (password.length < 8) {

            setError(
                "Password minimal 8 karakter."
            );

            return false;
        }


        // -------------------------------------------------
        // CONFIRM PASSWORD
        // -------------------------------------------------

        if (!confirmPassword) {

            setError(
                "Konfirmasi password wajib diisi."
            );

            return false;
        }


        if (
            password !==
            confirmPassword
        ) {

            setError(
                "Konfirmasi password tidak sama."
            );

            return false;
        }


        return true;
    }


    // =====================================================
    // VALIDATE BUSINESS
    // =====================================================

    function validateBusinessStep(): boolean {

        setError("");


        // -------------------------------------------------
        // NAMA WARTEG
        // -------------------------------------------------

        if (!namaWarteg.trim()) {

            setError(
                "Nama usaha / warteg wajib diisi."
            );

            return false;
        }


        if (
            namaWarteg.trim().length < 3
        ) {

            setError(
                "Nama usaha minimal 3 karakter."
            );

            return false;
        }


        // -------------------------------------------------
        // NOMOR HP
        // -------------------------------------------------

        if (!nomorHP.trim()) {

            setError(
                "Nomor HP wajib diisi."
            );

            return false;
        }


        const phone =
            nomorHP.replace(
                /\D/g,
                ""
            );


        if (
            phone.length < 10 ||
            phone.length > 15
        ) {

            setError(
                "Nomor HP harus terdiri dari 10–15 digit."
            );

            return false;
        }


        // -------------------------------------------------
        // ALAMAT
        // -------------------------------------------------

        if (!alamat.trim()) {

            setError(
                "Alamat usaha wajib diisi."
            );

            return false;
        }


        if (
            alamat.trim().length < 10
        ) {

            setError(
                "Alamat usaha terlalu pendek. Masukkan alamat yang lengkap."
            );

            return false;
        }


        return true;
    }


    // =====================================================
    // VALIDATE IDENTITY
    // =====================================================

    function validateIdentityStep(): boolean {

        setError("");


        const nik =
            ktpNumber.replace(
                /\D/g,
                ""
            );


        // -------------------------------------------------
        // NIK
        // -------------------------------------------------

        if (!nik) {

            setError(
                "NIK KTP wajib diisi."
            );

            return false;
        }


        if (
            nik.length !== 16
        ) {

            setError(
                "NIK KTP harus terdiri dari 16 digit."
            );

            return false;
        }


        // -------------------------------------------------
        // FILE
        // -------------------------------------------------

        if (!ktpFile) {

            setError(
                "Foto KTP wajib diunggah."
            );

            return false;
        }


        return true;
    }


    // =====================================================
    // NEXT
    // =====================================================

    async function handleNext() {

        if (loading) {
            return;
        }

        setError("");


        // =================================================
        // STEP 1
        // =================================================

        if (step === 1) {

            const valid =
                validateAccountStep();


            if (!valid) {
                return;
            }


            // -------------------------------------------------
            // CUSTOMER
            // -------------------------------------------------

            if (
                accountType ===
                "customer"
            ) {

                await handleRegister();

                return;
            }


            // -------------------------------------------------
            // SELLER
            // -------------------------------------------------

            setStep(2);

            return;
        }


        // =================================================
        // STEP 2
        // =================================================

        if (step === 2) {

            const valid =
                validateBusinessStep();


            if (!valid) {
                return;
            }


            setStep(3);

            return;
        }


        // =================================================
        // STEP 3
        // =================================================

        if (step === 3) {

            const valid =
                validateIdentityStep();


            if (!valid) {
                return;
            }


            await handleRegister();

            return;
        }
    }


    // =====================================================
    // BACK
    // =====================================================

    function handleBack() {

        if (loading) {
            return;
        }

        setError("");


        if (step <= 1) {
            return;
        }


        setStep(
            (currentStep) =>
                currentStep - 1
        );
    }


    // =====================================================
    // KTP FILE
    // =====================================================

    function handleKtpChange(
        file: File | undefined
    ) {

        setError("");


        if (!file) {
            return;
        }


        // -------------------------------------------------
        // FILE TYPE
        // -------------------------------------------------

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            setError(
                "Foto KTP harus JPG, PNG, atau WEBP."
            );

            if (ktpInputRef.current) {

                ktpInputRef.current.value =
                    "";
            }

            return;
        }


        // -------------------------------------------------
        // FILE SIZE
        // -------------------------------------------------

        const maxSize =
            5 * 1024 * 1024;


        if (
            file.size >
            maxSize
        ) {

            setError(
                "Ukuran foto KTP maksimal 5 MB."
            );

            if (ktpInputRef.current) {

                ktpInputRef.current.value =
                    "";
            }

            return;
        }


        // -------------------------------------------------
        // OLD PREVIEW
        // -------------------------------------------------

        if (ktpPreview) {

            URL.revokeObjectURL(
                ktpPreview
            );
        }


        // -------------------------------------------------
        // SAVE FILE
        // -------------------------------------------------

        setKtpFile(file);


        const preview =
            URL.createObjectURL(
                file
            );


        setKtpPreview(
            preview
        );
    }


    // =====================================================
    // REMOVE KTP
    // =====================================================

    function removeKtp() {

        if (loading) {
            return;
        }


        if (ktpPreview) {

            URL.revokeObjectURL(
                ktpPreview
            );
        }


        setKtpFile(null);

        setKtpPreview("");

        setError("");


        if (
            ktpInputRef.current
        ) {

            ktpInputRef.current.value =
                "";
        }
    }


    // =====================================================
    // REGISTER
    // =====================================================

    async function handleRegister() {

        if (loading) {
            return;
        }


        setError("");


        try {

            setLoading(true);


            // =================================================
            // CUSTOMER
            // =================================================

            if (
                accountType ===
                "customer"
            ) {

                const payload = {

                    name:
                        name.trim(),

                    email:
                        email.trim()
                            .toLowerCase(),

                    password:
                        password,

                    role:
                        "customer",
                };


                console.log(
                    "REGISTER CUSTOMER:",
                    {
                        name:
                            payload.name,

                        email:
                            payload.email,

                        passwordLength:
                            payload.password.length,

                        role:
                            payload.role,
                    }
                );


                await api.post(
                    "/auth/register",
                    payload
                );
            }


            // =================================================
            // SELLER
            // =================================================

            else {

                /*
                 * PENTING:
                 *
                 * Seller menggunakan multipart/form-data
                 * karena mengirim file KTP.
                 */

                const formData =
                    new FormData();


                // -------------------------------------------------
                // BASIC ACCOUNT
                // -------------------------------------------------

                formData.append(
                    "name",
                    name.trim()
                );


                formData.append(
                    "email",
                    email.trim()
                        .toLowerCase()
                );


                formData.append(
                    "password",
                    password
                );


                /*
                 * Role sebenarnya sudah dipaksa
                 * menjadi seller di backend.
                 *
                 * Tetap dikirim supaya request
                 * eksplisit.
                 */

                formData.append(
                    "role",
                    "seller"
                );


                // -------------------------------------------------
                // BUSINESS
                // -------------------------------------------------

                formData.append(
                    "nama_warteg",
                    namaWarteg.trim()
                );


                formData.append(
                    "nomor_hp",
                    nomorHP.replace(
                        /\D/g,
                        ""
                    )
                );


                formData.append(
                    "alamat",
                    alamat.trim()
                );


                // -------------------------------------------------
                // IDENTITY
                // -------------------------------------------------

                formData.append(
                    "ktp_number",
                    ktpNumber.replace(
                        /\D/g,
                        ""
                    )
                );


                // -------------------------------------------------
                // KTP FILE
                // -------------------------------------------------

                if (ktpFile) {

                    formData.append(
                        "ktp_image",
                        ktpFile,
                        ktpFile.name
                    );
                }


                // =================================================
                // DEBUG
                // =================================================

                console.log(
                    "REGISTER SELLER:",
                    {
                        name:
                            name.trim(),

                        email:
                            email.trim()
                                .toLowerCase(),

                        passwordLength:
                            password.length,

                        role:
                            "seller",

                        namaWarteg:
                            namaWarteg.trim(),

                        nomorHP:
                            nomorHP.replace(
                                /\D/g,
                                ""
                            ),

                        alamat:
                            alamat.trim(),

                        ktpNumber:
                            ktpNumber.replace(
                                /\D/g,
                                ""
                            ),

                        ktpFile:
                            ktpFile?.name ??
                            null,
                    }
                );


                /*
                 * JANGAN menambahkan:
                 *
                 * headers: {
                 *     "Content-Type":
                 *         "multipart/form-data"
                 * }
                 *
                 * Browser/Axios harus membuat boundary
                 * multipart secara otomatis.
                 */

                await api.post(
                    "/auth/register",
                    formData
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            setSuccess(true);


        } catch (err: any) {

            console.error(
                "REGISTER ERROR:",
                err
            );


            const backendError =
                err?.response?.data?.error;


            const backendMessage =
                err?.response?.data?.message;


            const fallback =
                "Pendaftaran gagal. Silakan coba lagi.";


            setError(
                backendError ||
                backendMessage ||
                fallback
            );


        } finally {

            setLoading(false);
        }
    }


    // =====================================================
    // STEP TITLE
    // =====================================================

    function getStepTitle(): string {

        if (
            accountType ===
            "customer"
        ) {

            return "Buat Akun";
        }


        if (step === 1) {

            return "Buat Akun";
        }


        if (step === 2) {

            return "Data Usaha";
        }


        return "Verifikasi Identitas";
    }


    // =====================================================
    // STEP DESCRIPTION
    // =====================================================

    function getStepDescription(): string {

        if (
            accountType ===
            "customer"
        ) {

            return (
                "Daftar untuk mulai menikmati layanan WartegKita."
            );
        }


        if (step === 1) {

            return (
                "Buat akun WartegKita terlebih dahulu."
            );
        }


        if (step === 2) {

            return (
                "Lengkapi informasi warteg yang akan kamu kelola."
            );
        }


        return (
            "Verifikasi identitas pemilik usaha untuk keamanan akun."
        );
    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="register-page">

            <div className="register-wrapper">


                {/* =====================================================
                    LEFT BRAND
                ===================================================== */}

                <section className="register-left">

                    <div className="register-brand">

                        <div className="register-logo">

                            <img
                                src={
                                    WartegKitaLogo
                                }
                                alt="WartegKita"
                            />

                        </div>


                        <h1>
                            WartegKita
                        </h1>


                        <p>
                            Digitalisasi Warteg Indonesia
                        </p>

                    </div>


                    <div className="register-features">


                        {/* FEATURE 1 */}

                        <div className="register-feature">

                            <span>
                                🍛
                            </span>

                            <div>

                                <strong>
                                    Pesan makanan
                                </strong>

                                <small>
                                    Temukan warteg favorit di sekitarmu.
                                </small>

                            </div>

                        </div>


                        {/* FEATURE 2 */}

                        <div className="register-feature">

                            <span>
                                🏪
                            </span>

                            <div>

                                <strong>
                                    Kembangkan usaha
                                </strong>

                                <small>
                                    Bawa wartegmu ke dunia digital.
                                </small>

                            </div>

                        </div>


                        {/* FEATURE 3 */}

                        <div className="register-feature">

                            <span>
                                💳
                            </span>

                            <div>

                                <strong>
                                    Pembayaran mudah
                                </strong>

                                <small>
                                    Nikmati transaksi yang praktis dan aman.
                                </small>

                            </div>

                        </div>


                        {/* FEATURE 4 */}

                        <div className="register-feature">

                            <span>
                                📦
                            </span>

                            <div>

                                <strong>
                                    Kelola pesanan
                                </strong>

                                <small>
                                    Pantau pesanan dengan lebih mudah.
                                </small>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    RIGHT
                ===================================================== */}

                <section className="register-right">

                    <div className="register-card">


                        {/* =================================================
                            BADGE
                        ================================================= */}

                        <div className="register-badge">

                            <span className="register-badge-icon">

                                <CheckCircle2
                                    size={16}
                                />

                            </span>

                            <span>

                                {
                                    accountType ===
                                        "seller"

                                        ? "Daftar sebagai Mitra Warteg"

                                        : "Bergabung dengan WartegKita"

                                }

                            </span>

                        </div>


                        {/* =================================================
                            SELLER PROGRESS
                        ================================================= */}

                        {
                            accountType ===
                            "seller" && (

                                <div className="register-progress">


                                    {/* STEP 1 */}

                                    <div
                                        className={
                                            step >= 1
                                                ? "progress-step active"
                                                : "progress-step"
                                        }
                                    >

                                        <span>
                                            1
                                        </span>

                                        <small>
                                            Akun
                                        </small>

                                    </div>


                                    {/* LINE 1 */}

                                    <div
                                        className={
                                            step >= 2
                                                ? "progress-line active"
                                                : "progress-line"
                                        }
                                    />


                                    {/* STEP 2 */}

                                    <div
                                        className={
                                            step >= 2
                                                ? "progress-step active"
                                                : "progress-step"
                                        }
                                    >

                                        <span>
                                            2
                                        </span>

                                        <small>
                                            Usaha
                                        </small>

                                    </div>


                                    {/* LINE 2 */}

                                    <div
                                        className={
                                            step >= 3
                                                ? "progress-line active"
                                                : "progress-line"
                                        }
                                    />


                                    {/* STEP 3 */}

                                    <div
                                        className={
                                            step >= 3
                                                ? "progress-step active"
                                                : "progress-step"
                                        }
                                    >

                                        <span>
                                            3
                                        </span>

                                        <small>
                                            Verifikasi
                                        </small>

                                    </div>

                                </div>

                            )
                        }


                        {/* =================================================
                            HEADING
                        ================================================= */}

                        <div className="register-heading">

                            <h2>
                                {
                                    getStepTitle()
                                }
                            </h2>

                            <p>
                                {
                                    getStepDescription()
                                }
                            </p>

                        </div>


                        {/* =================================================
                            STEP 1 — ACCOUNT
                        ================================================= */}

                        {
                            step === 1 && (

                                <>

                                    {/* ---------------------------------
                                        ROLE
                                    --------------------------------- */}

                                    <label>
                                        Daftar Sebagai
                                    </label>


                                    <div className="role-choice">


                                        {/* CUSTOMER */}

                                        <button
                                            type="button"
                                            className={
                                                accountType ===
                                                    "customer"
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                handleAccountType(
                                                    "customer"
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                        >

                                            <span>
                                                🍛
                                            </span>

                                            <div>

                                                <strong>
                                                    Pembeli
                                                </strong>

                                                <small>
                                                    Pesan makanan
                                                </small>

                                            </div>

                                        </button>


                                        {/* SELLER */}

                                        <button
                                            type="button"
                                            className={
                                                accountType ===
                                                    "seller"
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                handleAccountType(
                                                    "seller"
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                        >

                                            <Store
                                                size={20}
                                            />

                                            <div>

                                                <strong>
                                                    Pemilik Warteg
                                                </strong>

                                                <small>
                                                    Buka usaha online
                                                </small>

                                            </div>

                                        </button>

                                    </div>


                                    {/* ---------------------------------
                                        NAME
                                    --------------------------------- */}

                                    <label>
                                        Nama Lengkap
                                    </label>


                                    <div className="input">

                                        <User
                                            size={20}
                                        />

                                        <input
                                            type="text"
                                            placeholder="Masukkan nama lengkap"
                                            value={
                                                name
                                            }
                                            onChange={(e) =>
                                                setName(
                                                    e.target.value
                                                )
                                            }
                                            autoComplete="name"
                                            disabled={
                                                loading
                                            }
                                        />

                                    </div>


                                    {/* ---------------------------------
                                        EMAIL
                                    --------------------------------- */}

                                    <label>
                                        Email
                                    </label>


                                    <div className="input">

                                        <Mail
                                            size={20}
                                        />

                                        <input
                                            type="email"
                                            placeholder="contoh@email.com"
                                            value={
                                                email
                                            }
                                            onChange={(e) =>
                                                setEmail(
                                                    e.target.value
                                                )
                                            }
                                            autoComplete="email"
                                            disabled={
                                                loading
                                            }
                                        />

                                    </div>


                                    {/* ---------------------------------
                                        PASSWORD
                                    --------------------------------- */}

                                    <label>
                                        Password
                                    </label>


                                    <div className="input">

                                        <Lock
                                            size={20}
                                        />

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Minimal 8 karakter"
                                            value={
                                                password
                                            }
                                            onChange={(e) =>
                                                setPassword(
                                                    e.target.value
                                                )
                                            }
                                            autoComplete="new-password"
                                            disabled={
                                                loading
                                            }
                                        />


                                        <button
                                            type="button"
                                            className="eye"
                                            onClick={() =>
                                                setShowPassword(
                                                    (value) =>
                                                        !value
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                        >

                                            {
                                                showPassword

                                                    ? (
                                                        <EyeOff
                                                            size={18}
                                                        />
                                                    )

                                                    : (
                                                        <Eye
                                                            size={18}
                                                        />
                                                    )
                                            }

                                        </button>

                                    </div>


                                    {/* ---------------------------------
                                        CONFIRM PASSWORD
                                    --------------------------------- */}

                                    <label>
                                        Konfirmasi Password
                                    </label>


                                    <div className="input">

                                        <Lock
                                            size={20}
                                        />

                                        <input
                                            type={
                                                showConfirm
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Ulangi password"
                                            value={
                                                confirmPassword
                                            }
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            autoComplete="new-password"
                                            disabled={
                                                loading
                                            }
                                        />


                                        <button
                                            type="button"
                                            className="eye"
                                            onClick={() =>
                                                setShowConfirm(
                                                    (value) =>
                                                        !value
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                        >

                                            {
                                                showConfirm

                                                    ? (
                                                        <EyeOff
                                                            size={18}
                                                        />
                                                    )

                                                    : (
                                                        <Eye
                                                            size={18}
                                                        />
                                                    )
                                            }

                                        </button>

                                    </div>

                                </>

                            )
                        }


                        {/* =================================================
                            STEP 2 — BUSINESS
                        ================================================= */}

                        {
                            accountType ===
                            "seller" &&
                            step === 2 && (

                                <>


                                    {/* INFO */}

                                    <div className="step-info">

                                        <Store
                                            size={22}
                                        />

                                        <div>

                                            <strong>
                                                Informasi Warteg
                                            </strong>

                                            <span>
                                                Data ini akan digunakan untuk
                                                membuat profil usaha kamu.
                                            </span>

                                        </div>

                                    </div>


                                    {/* NAMA WARTEG */}

                                    <label>
                                        Nama Usaha / Warteg
                                    </label>


                                    <div className="input">

                                        <Store
                                            size={20}
                                        />

                                        <input
                                            type="text"
                                            placeholder="Contoh: Warteg Berkah"
                                            value={
                                                namaWarteg
                                            }
                                            onChange={(e) =>
                                                setNamaWarteg(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                        />

                                    </div>


                                    {/* NOMOR HP */}

                                    <label>
                                        Nomor HP Pemilik
                                    </label>


                                    <div className="input">

                                        <Phone
                                            size={20}
                                        />

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="08xxxxxxxxxx"
                                            value={
                                                nomorHP
                                            }
                                            onChange={(e) =>
                                                setNomorHP(
                                                    e.target.value.replace(
                                                        /[^\d+\-\s]/g,
                                                        ""
                                                    )
                                                )
                                            }
                                            autoComplete="tel"
                                            disabled={
                                                loading
                                            }
                                        />

                                    </div>


                                    {/* ALAMAT */}

                                    <label>
                                        Alamat Usaha
                                    </label>


                                    <div className="input textarea-input">

                                        <MapPin
                                            size={20}
                                        />

                                        <textarea
                                            placeholder="Masukkan alamat lengkap warteg"
                                            value={
                                                alamat
                                            }
                                            onChange={(e) =>
                                                setAlamat(
                                                    e.target.value
                                                )
                                            }
                                            rows={4}
                                            disabled={
                                                loading
                                            }
                                        />

                                    </div>


                                    {/* HINT */}

                                    <div className="form-hint">

                                        <MapPin
                                            size={15}
                                        />

                                        <span>
                                            Pastikan alamat sesuai dengan lokasi
                                            usaha yang sebenarnya.
                                        </span>

                                    </div>

                                </>

                            )
                        }


                        {/* =================================================
                            STEP 3 — IDENTITY
                        ================================================= */}

                        {
                            accountType ===
                            "seller" &&
                            step === 3 && (

                                <>


                                    {/* INFO */}

                                    <div className="step-info">

                                        <ShieldCheck
                                            size={22}
                                        />

                                        <div>

                                            <strong>
                                                Verifikasi Identitas
                                            </strong>

                                            <span>
                                                Data KTP digunakan untuk
                                                verifikasi pemilik usaha.
                                            </span>

                                        </div>

                                    </div>


                                    {/* NIK */}

                                    <label>
                                        NIK KTP
                                    </label>


                                    <div className="input">

                                        <CreditCard
                                            size={20}
                                        />

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={16}
                                            placeholder="16 digit NIK"
                                            value={
                                                ktpNumber
                                            }
                                            onChange={(e) => {

                                                const value =
                                                    e.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                        .slice(
                                                            0,
                                                            16
                                                        );

                                                setKtpNumber(
                                                    value
                                                );

                                            }}
                                            disabled={
                                                loading
                                            }
                                        />

                                    </div>


                                    {/* COUNTER */}

                                    <div className="nik-counter">

                                        {ktpNumber.length}
                                        /16 digit

                                    </div>


                                    {/* FILE LABEL */}

                                    <label>
                                        Foto KTP
                                    </label>


                                    {/* HIDDEN FILE INPUT */}

                                    <input
                                        ref={
                                            ktpInputRef
                                        }
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        hidden
                                        onChange={(e) =>
                                            handleKtpChange(
                                                e.target.files?.[0]
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                    />


                                    {/* =================================================
                                        KTP PREVIEW
                                    ================================================= */}

                                    {
                                        ktpPreview ? (

                                            <div className="ktp-preview">

                                                <img
                                                    src={
                                                        ktpPreview
                                                    }
                                                    alt="Preview KTP"
                                                />


                                                <button
                                                    type="button"
                                                    onClick={
                                                        removeKtp
                                                    }
                                                    disabled={
                                                        loading
                                                    }
                                                >

                                                    <X
                                                        size={18}
                                                    />

                                                </button>


                                                <div className="ktp-preview-label">

                                                    <CheckCircle2
                                                        size={16}
                                                    />

                                                    Foto KTP siap diverifikasi

                                                </div>

                                            </div>

                                        ) : (

                                            <button
                                                type="button"
                                                className="ktp-upload"
                                                onClick={() =>
                                                    ktpInputRef
                                                        .current
                                                        ?.click()
                                                }
                                                disabled={
                                                    loading
                                                }
                                            >

                                                <div className="upload-icon">

                                                    <Upload
                                                        size={22}
                                                    />

                                                </div>


                                                <strong>
                                                    Upload Foto KTP
                                                </strong>


                                                <span>
                                                    Pilih foto KTP yang jelas dan mudah dibaca
                                                </span>


                                                <small>
                                                    JPG / PNG / WEBP • Maks. 5 MB
                                                </small>

                                            </button>

                                        )
                                    }


                                    {/* =================================================
                                        SECURITY NOTICE
                                    ================================================= */}

                                    <div className="seller-notice">

                                        <ShieldCheck
                                            size={20}
                                        />

                                        <div>

                                            <strong>
                                                Data kamu aman
                                            </strong>

                                            <span>
                                                KTP hanya digunakan untuk
                                                proses verifikasi identitas
                                                pemilik usaha dan tidak
                                                ditampilkan kepada pelanggan.
                                            </span>

                                        </div>

                                    </div>

                                </>

                            )
                        }


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {
                            error && (

                                <div className="error">

                                    <CircleAlert
                                        size={18}
                                    />

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            )
                        }


                        {/* =================================================
                            ACTION
                        ================================================= */}

                        <div className="register-actions">


                            {/* BACK */}

                            {
                                step > 1 && (

                                    <button
                                        type="button"
                                        className="back-btn"
                                        onClick={
                                            handleBack
                                        }
                                        disabled={
                                            loading
                                        }
                                    >

                                        <ArrowLeft
                                            size={18}
                                        />

                                        Kembali

                                    </button>

                                )
                            }


                            {/* NEXT / REGISTER */}

                            <button
                                type="button"
                                className="register-btn"
                                onClick={
                                    handleNext
                                }
                                disabled={
                                    loading
                                }
                            >

                                {
                                    loading ? (

                                        <>

                                            <div className="loader" />

                                            Mendaftarkan...

                                        </>

                                    ) : (

                                        <>

                                            {
                                                accountType ===
                                                    "seller" &&
                                                    step === 3

                                                    ? (

                                                        <>

                                                            <Store
                                                                size={19}
                                                            />

                                                            Daftarkan Usaha

                                                        </>

                                                    )

                                                    : (

                                                        <>

                                                            Lanjutkan

                                                            <ArrowRight
                                                                size={19}
                                                            />

                                                        </>

                                                    )
                                            }

                                        </>

                                    )
                                }

                            </button>

                        </div>


                        {/* =================================================
                            LOGIN
                        ================================================= */}

                        <div className="divider">

                            <span />

                        </div>


                        <div className="register">

                            <span>
                                Sudah punya akun?
                            </span>

                            <Link to="/login">
                                Masuk sekarang
                            </Link>

                        </div>


                    </div>

                </section>

            </div>


            {/* =====================================================
                SUCCESS
            ===================================================== */}

            {
                success && (

                    <div className="success-overlay">

                        <div className="success-popup">


                            <div className="success-icon">

                                <CheckCircle2
                                    size={50}
                                />

                            </div>


                            <h3>

                                {
                                    accountType ===
                                        "seller"

                                        ? "Usaha Berhasil Didaftarkan 🎉"

                                        : "Pendaftaran Berhasil 🎉"
                                }

                            </h3>


                            <p>

                                {
                                    accountType ===
                                        "seller"

                                        ? (

                                            <>
                                                Akun{" "}

                                                <strong>
                                                    {namaWarteg}
                                                </strong>{" "}

                                                berhasil dibuat.
                                                Data usaha sedang
                                                menunggu proses
                                                verifikasi.
                                            </>

                                        )

                                        : (

                                            "Akun pelanggan berhasil dibuat. Silakan login untuk mulai memesan makanan."

                                        )
                                }

                            </p>


                            <button
                                type="button"
                                onClick={() => {

                                    resetForm();

                                    navigate(
                                        "/login"
                                    );

                                }}
                            >

                                LOGIN SEKARANG

                            </button>

                        </div>

                    </div>

                )
            }

        </div>
    );
}