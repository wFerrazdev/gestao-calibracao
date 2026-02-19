export function isCriador(firebaseUid: string): boolean {
    const criadorUid = process.env.AUTH_UID_CRIADOR;
    return firebaseUid === criadorUid;
}
