/**
 * Integração WhatsApp via Z-API
 * Docs: https://www.z-api.io
 *
 * Variáveis de ambiente:
 * - ZAPI_INSTANCE_ID
 * - ZAPI_TOKEN
 * - ZAPI_CLIENT_TOKEN
 */

const ZAPI_BASE_URL = "https://api.z-api.io";

function getConfig() {
  return {
    instanceId: process.env.ZAPI_INSTANCE_ID,
    token: process.env.ZAPI_TOKEN,
    clientToken: process.env.ZAPI_CLIENT_TOKEN,
  };
}

function isConfigured(): boolean {
  const { instanceId, token, clientToken } = getConfig();
  return !!(instanceId && token && clientToken);
}

export function formatPhoneForZAPI(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isConfigured()) {
    console.warn(`[WhatsApp] Z-API não configurado — mensagem simulada para ${phone}`);
    return { success: true, messageId: `sim_${Date.now()}` };
  }

  const { instanceId, token, clientToken } = getConfig();
  const formattedPhone = formatPhoneForZAPI(phone);
  const url = `${ZAPI_BASE_URL}/instances/${instanceId}/token/${token}/send-text`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken!,
      },
      body: JSON.stringify({ phone: formattedPhone, message, delayTyping: 1 }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errText}` };
    }
    const data = (await response.json()) as { messageId?: string };
    return { success: true, messageId: data.messageId };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function sendEmployeeLoginToken(
  phone: string,
  employeeName: string,
  token: string,
  companyName: string,
) {
  const message = `🔐 *${companyName} — NR1Check*\n\nOlá, *${employeeName}*!\n\nSeu código de acesso é:\n\n*${token}*\n\nExpira em 15 minutos. Não compartilhe.`;
  return sendWhatsAppMessage(phone, message);
}

export async function sendAssessmentInvitation(
  phone: string,
  employeeName: string,
  assessmentLink: string,
  companyName: string,
  deadline?: string,
) {
  const deadlineText = deadline ? `\n⏰ Prazo: *${deadline}*` : "";
  const message = `🧠 *${companyName} — Avaliação NR-1*\n\nOlá, *${employeeName}*!\n\nSua empresa está realizando a avaliação de riscos psicossociais exigida pela NR-1.\n\nResponda o questionário confidencial:${deadlineText}\n\n👉 Acessar:\n${assessmentLink}\n\n_Respostas confidenciais e protegidas pela LGPD._`;
  return sendWhatsAppMessage(phone, message);
}

export async function checkZAPIStatus() {
  if (!isConfigured()) return { connected: false, configured: false };
  const { instanceId, token, clientToken } = getConfig();
  try {
    const r = await fetch(`${ZAPI_BASE_URL}/instances/${instanceId}/token/${token}/status`, {
      headers: { "Client-Token": clientToken! },
    });
    const data = (await r.json()) as { connected?: boolean; smartphoneConnected?: boolean };
    return { connected: data.connected === true || data.smartphoneConnected === true, configured: true };
  } catch (err) {
    return { connected: false, configured: true, error: (err as Error).message };
  }
}
