(function () {
  const CHAT_IFRAME_URL = window.ZODIACBEE_CHAT_URL || "https://afzaljafri-one.github.io/test-jafri-one/";
  const AVATAR_URL = "https://files.jotform.com/jufs/Bee_Zodiac/agent_files/avatar_images/Gemini_Generated_Image_acdtcxacdtcxacdt-removebg-preview_1_-6ac583e161f350.27103431.png";

  const container = document.createElement("div");
  container.id = "zodiacbee-widget-container";
  container.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const greeting = document.createElement("div");
  greeting.innerHTML = "✨ Your stars show positive changes ahead. <span style='font-size:12px;opacity:0.8;'>✕</span>";
  greeting.style.cssText = `
    background: rgba(14, 20, 36, 0.95);
    color: #D4AF37;
    border: 1px solid rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    border-radius: 14px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    animation: pulseGlow 2s infinite ease-in-out;
    transition: all 0.2s ease;
  `;
  greeting.onclick = (e) => {
    e.stopPropagation();
    greeting.style.display = "none";
  };

  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 10px rgba(212, 175, 55, 0.2); }
      50% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.5); }
    }
  `;
  document.head.appendChild(styleSheet);

  const bubble = document.createElement("div");
  bubble.id = "zodiacbee-chat-bubble";
  bubble.style.cssText = `
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: radial-gradient(circle, #D4AF37 0%, #a4821c 100%);
    box-shadow: 0 8px 24px rgba(212, 175, 55, 0.45);
    border: 2px solid #D4AF37;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;
  bubble.onmouseenter = () => (bubble.style.transform = "scale(1.08)");
  bubble.onmouseleave = () => (bubble.style.transform = "scale(1)");

  const avatar = document.createElement("img");
  avatar.src = AVATAR_URL;
  avatar.alt = "AskBee";
  avatar.style.cssText = "width: 100%; height: 100%; object-fit: cover;";
  bubble.appendChild(avatar);

  const iframeContainer = document.createElement("div");
  iframeContainer.id = "zodiacbee-chat-modal";
  iframeContainer.style.cssText = `
    position: fixed;
    bottom: 102px;
    right: 24px;
    width: 420px;
    height: 640px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 120px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 30px rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 24px;
    overflow: hidden;
    z-index: 999999;
    display: none;
    transition: all 0.3s ease;
  `;

  const iframe = document.createElement("iframe");
  iframe.src = CHAT_IFRAME_URL;
  iframe.style.cssText = "width: 100%; height: 100%; border: none;";
  iframeContainer.appendChild(iframe);

  bubble.onclick = function () {
    const isHidden = iframeContainer.style.display === "none";
    iframeContainer.style.display = isHidden ? "block" : "none";
    if (isHidden) greeting.style.display = "none";
  };

  container.appendChild(greeting);
  container.appendChild(bubble);
  document.body.appendChild(container);
  document.body.appendChild(iframeContainer);
})();
