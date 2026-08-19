/* =========================================================
   WARTEGKITA CHAT MODERATION
   Frontend Content Safety Layer

   Catatan:
   - File ini hanya untuk UX / frontend validation.
   - Backend tetap WAJIB melakukan validasi yang sama.
   - User tidak boleh bisa bypass moderation hanya dengan
     memanggil API secara langsung.
========================================================= */


/* =========================================================
   BLOCKED WORDS
========================================================= */

const BLOCKED_WORDS = [
    // Bahasa Indonesia
    "anjing",
    "bangsat",
    "bajingan",
    "brengsek",
    "kampret",
    "kontol",
    "memek",
    "ngentot",
    "jancuk",
    "pepek",
    "tolol",
    "goblok",
    "idiot",

    // Bahasa Inggris
    "fuck",
    "fucking",
    "shit",
    "bitch",
    "asshole",
    "dumbass",
];


/* =========================================================
   SEXUAL CONTENT PATTERNS
========================================================= */

const SEXUAL_PATTERNS = [
    /\bsex\b/i,
    /\bseks\b/i,
    /\bporn\b/i,
    /\bporno\b/i,
    /\bpornografi\b/i,
    /\bxxx\b/i,
    /\bvagina\b/i,
    /\bpenis\b/i,
    /\bsperma\b/i,
    /\bmasturbasi\b/i,
    /\bmasturbate\b/i,
    /\bkonten seksual\b/i,
    /\bvideo porno\b/i,
    /\bfoto porno\b/i,
];


/* =========================================================
   THREAT / VIOLENCE PATTERNS
========================================================= */

const THREAT_PATTERNS = [
    /\baku bunuh\b/i,
    /\bgue bunuh\b/i,
    /\bgw bunuh\b/i,
    /\bsaya bunuh\b/i,
    /\bbunuh kamu\b/i,
    /\bbunuh lu\b/i,
    /\bkill you\b/i,
];


/* =========================================================
   NORMALIZE MESSAGE
========================================================= */

/**
 * Normalisasi pesan sebelum dilakukan moderation.
 *
 * Contoh:
 * "K0NT0L!!!" -> "kontol"
 * "f.u.c.k"   -> "f u c k"
 *
 * Tujuannya supaya filter tidak terlalu mudah dilewati
 * menggunakan angka atau karakter khusus.
 */
const normalizeForModeration = (
    value: string,
): string => {
    return value
        .toLowerCase()
        .normalize("NFKC")

        // Character substitution
        .replace(/0/g, "o")
        .replace(/1/g, "i")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/7/g, "t")

        // Hapus karakter khusus
        .replace(
            /[^a-z0-9\s]/gi,
            " ",
        )

        // Rapikan whitespace
        .replace(
            /\s+/g,
            " ",
        )

        .trim();
};


/* =========================================================
   CHECK BLOCKED WORD
========================================================= */

const containsBlockedWord = (
    normalizedMessage: string,
): boolean => {

    const words =
        normalizedMessage.split(/\s+/);

    return BLOCKED_WORDS.some(
        (blockedWord) =>
            words.includes(
                blockedWord,
            ),
    );
};


/* =========================================================
   CHECK SEXUAL CONTENT
========================================================= */

const containsSexualContent = (
    normalizedMessage: string,
): boolean => {

    return SEXUAL_PATTERNS.some(
        (pattern) =>
            pattern.test(
                normalizedMessage,
            ),
    );
};


/* =========================================================
   CHECK THREAT
========================================================= */

const containsThreat = (
    normalizedMessage: string,
): boolean => {

    return THREAT_PATTERNS.some(
        (pattern) =>
            pattern.test(
                normalizedMessage,
            ),
    );
};


/* =========================================================
   PUBLIC MODERATION FUNCTION
========================================================= */

/**
 * Mengecek apakah pesan mengandung konten terlarang.
 *
 * Return:
 * true  -> pesan ditolak
 * false -> pesan aman untuk diteruskan
 */
export const containsBlockedContent = (
    message: string,
): boolean => {

    const normalizedMessage =
        normalizeForModeration(
            message,
        );

    if (!normalizedMessage) {
        return false;
    }

    return (
        containsBlockedWord(
            normalizedMessage,
        ) ||
        containsSexualContent(
            normalizedMessage,
        ) ||
        containsThreat(
            normalizedMessage,
        )
    );
};


/* =========================================================
   PUBLIC WARNING MESSAGE
========================================================= */

export const CHAT_MODERATION_WARNING =
    "Pesan tidak dapat dikirim. Gunakan bahasa yang sopan dan hindari kata kasar, konten seksual, pelecehan, atau ancaman.";