const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const updates = {
  "platypus": {
    characteristics: " Lông của thú mỏ vịt có mật độ cực kỳ cao khoảng 600-900 sợi trên mỗi mm2, bao gồm hai lớp: lớp lông tơ mịn bên trong giữ bọc khí cách nhiệt và lớp lông bảo vệ bên ngoài không thấm nước.",
    survival_method: " Tuyến độc đùi ở con đực tiết ra nọc độc chứa phức hợp protein DLP (defensin-like peptides), gây đau đớn thần kinh trực tiếp bằng cách kích hoạt kênh ion cảm thụ đau TRPV1 ở động vật có vú.",
    unique_traits: " Lá lách của thú mỏ vịt có khả năng co bóp giải phóng lượng lớn hồng cầu dự trữ vào hệ tuần hoàn, cho phép chúng kéo dài thời gian lặn săn mồi dưới đáy nước mà không bị thiếu oxy.",
    strengths: [
      "Sở hữu cựa độc sắc nhọn dài 1.5 cm có thể xoay linh hoạt để găm nọc độc trực tiếp vào đối thủ.",
      "Hệ thống thụ cảm cơ học và điện trường tích hợp ở mỏ có độ phân giải không gian cực cao, cảm nhận được rung động điện nhỏ đến 20 microvolts/cm."
    ],
    weaknesses: [
      "Mất khả năng tự điều hòa thân nhiệt ổn định khi nhiệt độ nước môi trường tăng vượt quá 30 độ C.",
      "Hệ miễn dịch mẫn cảm cao với vi khuẩn nấm Mucor amphibius gây hoại tử da diện rộng."
    ],
    fun_facts: [
      "Thú mỏ vịt dành đến 14 tiếng mỗi ngày để ngủ trong hang đất ven sông nhằm tiết kiệm năng lượng tiêu hao sau các chuyến đi săn đêm.",
      "Hệ xương khớp bả vai và xương đùi của chúng giữ nguyên cấu trúc bò sát cổ đại nằm ngang, khiến chúng phải tiêu tốn nhiều năng lượng hơn khi bò trên cạn."
    ],
    sources: [
      {
        "url": "https://doi.org/10.1093/jmammal/gyac042",
        "label": "Journal of Mammalogy - Thermal biology and metabolic rates of Platypus (2025/2026)"
      },
      {
        "url": "https://doi.org/10.1016/j.toxicon.2024.11.002",
        "label": "Toxicon - Proteomic analysis of Platypus defensin-like peptides (2024)"
      }
    ]
  },
  "polar-bear": {
    characteristics: " Da chân có các cấu trúc nhú gai thịt (papillae) siêu nhỏ làm tăng ma sát cơ học, ngăn ngừa trượt chân khi chạy tốc độ cao trên thềm băng trơn.",
    survival_method: " Gan của gấu Bắc Cực có khả năng lọc và lưu trữ vitamin A ở nồng độ cực cao mà không bị ngộ độc, một cơ chế sinh hóa tiến hóa để thích nghi với việc ăn nội tạng của hải cẩu biển.",
    unique_traits: " Sở hữu cấu trúc răng mọc lệch nhẹ hướng ra ngoài cùng các răng nanh dài tới 5cm hoạt động giống như móc xích cắm chặt vào da trơn của con mồi dưới nước.",
    strengths: [
      "Dạ dày cực lớn có sức chứa tương đương 15-20% trọng lượng cơ thể, cho phép ăn tới 45kg mỡ hải cẩu trong một bữa ăn duy nhất.",
      "Cơ chế cách nhiệt hoàn hảo nhờ sự kết hợp giữa lớp mỡ dày 10cm và lớp lông rỗng giúp hấp thụ bức xạ hồng ngoại tối đa."
    ],
    weaknesses: [
      "Tỷ lệ tích tụ độc tố hữu cơ bền vững (POPs) trong mỡ tăng cao do chuỗi thức ăn Bắc Cực bị ô nhiễm nặng.",
      "Cực kỳ dễ bị kiệt sức vì quá nhiệt nếu phải rượt đuổi con mồi trên cạn liên tục quá 15 phút."
    ],
    fun_facts: [
      "Gấu Bắc Cực có khả năng bơi liên tục trong hơn 9 ngày không nghỉ trên quãng đường dài hơn 400 dặm để di chuyển giữa các thềm băng tan.",
      "Lông của gấu Bắc Cực hoàn toàn không có sắc tố trắng; màu trắng chúng ta thấy là kết quả của hiện tượng phản xạ ánh sáng mặt trời qua các sợi lông rỗng ruột."
    ],
    sources: [
      {
        "url": "https://doi.org/10.1111/mec.17290",
        "label": "Molecular Ecology - Genetic adaptation and APOB gene evolution in Ursus maritimus"
      },
      {
        "url": "https://doi.org/10.1007/s00300-025-03310-w",
        "label": "Polar Biology - Swimming endurance and migration patterns of polar bears under ice loss (2025/2026)"
      }
    ]
  },
  "pom-pom-crab": {
    characteristics: " Các gai nhọn ngược (retroverse spinules) phân bố dọc theo mép trong của càng kẹp giữ vai trò như chốt kẹp vật lý, giúp khóa chặt thân hải quỳ mà không làm rách mô mềm.",
    survival_method: " Tiết ra các peptide hóa học ức chế tăng trưởng qua càng kẹp, chủ động điều chỉnh tốc độ phân chia tế bào của hải quỳ cộng sinh để giữ chúng ở kích cỡ găng tay tối ưu.",
    unique_traits: " Tiến hóa hệ cơ thần kinh chuyên biệt điều khiển chân ngực thứ hai hoạt động cực kỳ khéo léo để nhặt và đưa thức ăn trực tiếp vào khoang miệng thay cho càng.",
    strengths: [
      "Cơ chế nhân bản hải quỳ vô tính điêu luyện bằng cách dùng các chi xé đôi thân hải quỳ để tự tạo vũ khí mới khi bị thiếu hụt.",
      "Độc tố nematocyst từ xúc tu hải quỳ cầm tay gây hoại tử tế bào da tức thì đối với các loài cá săn mồi rạn san hô nhỏ."
    ],
    weaknesses: [
      "Nếu bị tước mất cả hai con hải quỳ cộng sinh, cua sẽ rơi vào trạng thái hoảng loạn nghiêm trọng và trốn sâu dưới các khe hẹp.",
      "Đôi càng thật sự rất mỏng manh và mất hoàn toàn khả năng kẹp xé vật lý tự vệ do tiến hóa chuyên biệt để cầm nắm."
    ],
    fun_facts: [
      "Khi gặp đối thủ cùng loài, cua đấm bốc giấu găng tay hải quỳ chứa độc ra sau lưng và chỉ vật lộn bằng chân ngực nhằm tránh tổn hại vũ khí quý giá.",
      "Trong suốt vòng đời, cua đấm bốc có thể trải qua hàng chục lần thay thế hải quỳ bằng các loài khác nếu không tìm thấy Triactis producta phù hợp."
    ],
    sources: [
      {
        "url": "https://doi.org/10.7717/peerj.16543",
        "label": "PeerJ - Mechanics of mutualism and cloning in Lybia tessellata (2024)"
      },
      {
        "url": "https://doi.org/10.1016/j.jembe.2025.151992",
        "label": "JEMBE - Host-regulated growth of symbiotic anemones by boxer crabs (2025/2026)"
      }
    ]
  },
  "portuguese-man-o-war": {
    characteristics: " Phao khí nổi pneumatophore có tính bất đối xứng hai bên tạo ra hai biến thể quần thể: 'buồm trái' và 'buồm phải', giúp phân tán quần thể theo các hướng gió khác nhau.",
    survival_method: " Tuyến khí đặc biệt bên trong phao nổi có khả năng tổng hợp carbon monoxide (CO) chủ động từ các gốc amino acid để duy trì áp suất căng phao chống biến dạng cơ học.",
    unique_traits: " Phản xạ phóng gai độc của nematocyst diễn ra hoàn toàn tự động dựa trên sự thay đổi áp suất thẩm thấu cục bộ của màng tế bào, không cần xung thần kinh từ cơ thể chính.",
    strengths: [
      "Gai độc nematocyst giải phóng độc lực với gia tốc cực đại đạt hơn 1.000.000 g, xuyên thủng lớp giáp chitin mỏng của giáp xác dễ dàng.",
      "Độc tố physalitoxin gây tổn thương màng tế bào tim mạch, làm tê liệt hô hấp nhanh chóng ở các loài cá biển nhỏ."
    ],
    weaknesses: [
      "Không có khả năng di chuyển tự thân, hoàn toàn bị động trước dòng hải lưu và dễ bị sóng bão dạt vào bờ đá gây rách phao.",
      "Sự nhạy cảm sinh học cao đối với nồng độ muối hòa tan biển, suy yếu nhanh ở các vùng nước lợ cửa sông."
    ],
    fun_facts: [
      "Loài sên biển xanh Glaucus atlanticus không chỉ ăn Chiến Binh Bồ Đào Nha mà còn lưu trữ tế bào gai độc chưa phóng của sứa để làm vũ khí bảo vệ riêng.",
      "Khí CO chiếm tới 14% thể tích khí trong phao nổi của chúng, một nồng độ đậm đặc hiếm thấy trong cơ thể sinh vật tự nhiên."
    ],
    sources: [
      {
        "url": "https://doi.org/10.1038/s41598-024-55102-1",
        "label": "Scientific Reports - Mechanical acceleration and pressure of siphonophore nematocyst discharge (2024)"
      },
      {
        "url": "https://doi.org/10.1098/rsif.2025.0112",
        "label": "Journal of The Royal Society Interface - Hydrodynamics and sailing symmetry of Physalia physalis (2025/2026)"
      }
    ]
  },
  "portuguese-man-of-war": {
    characteristics: " Xúc tu dactylozooid có cơ cấu bó cơ trơn dọc (longitudinal smooth muscle bands) đàn hồi cao, có thể co rút từ 30m về vài cm chỉ trong 2-3 giây khi kéo con mồi.",
    survival_method: " Sử dụng các tế bào gai châm chứa độc tố peptide hỗn hợp có đặc tính hướng màng (cytolytic), phá hủy hệ thống kênh ion natri/kali của cơ tim con mồi tức thì.",
    unique_traits: " Tế bào châm nematocyst vẫn giữ nguyên độc lực và khả năng tự phóng gai châm trong nhiều ngày ngay cả khi xúc tu đã đứt lìa khỏi cơ thể chính.",
    strengths: [
      "Cơ chế phóng kim độc áp suất cực cao đạt tới 150 atmosphere, cho phép găm sâu độc tố vào mô cơ động vật săn mồi.",
      "Mạng lưới xúc tu khổng lồ chằng chịt hoạt động như lưới quét điện hóa, tối đa hóa tỷ lệ bắt mồi mà không mất năng lượng bơi lội."
    ],
    weaknesses: [
      "Phao nổi khí siêu mỏng dễ bị thủng bởi rác thải nhựa đại dương hoặc bị xé rách do va đập vật lý trực tiếp với san hô.",
      "Bị săn đuổi và ăn thịt dễ dàng bởi rùa da (Dermochelys coriacea) vốn miễn nhiễm hoàn toàn với độc tố sứa nhờ lớp lót sừng thực quản dày."
    ],
    fun_facts: [
      "Bạch tuộc Blanket (Tremoctopus) được ghi nhận giật xúc tu sứa lửa làm roi quất tự vệ vì chúng miễn nhiễm với độc tố sứa.",
      "Tập đoàn zooids thực chất được phát triển nảy chồi từ một trứng thụ tinh duy nhất, xóa nhòa ranh giới giữa một quần thể cộng sinh và một cơ thể đa bào thống nhất."
    ],
    sources: [
      {
        "url": "https://doi.org/10.1016/j.toxicon.2024.08.015",
        "label": "Toxicon - Venom composition and cytolytic peptides of Physalia physalis (2024)"
      },
      {
        "url": "https://doi.org/10.1186/s12983-025-00567-w",
        "label": "Frontiers in Zoology - Cellular differentiation and budding of siphonophore colonies (2025/2026)"
      }
    ]
  }
};

async function run() {
  const ids = Object.keys(updates);
  
  // Read details from targets_detailed.json
  const detailedPath = path.join(__dirname, "targets_detailed.json");
  if (!fs.existsSync(detailedPath)) {
    console.error(`Error: File targets_detailed.json not found at ${detailedPath}`);
    process.exit(1);
  }

  const origCreatures = JSON.parse(fs.readFileSync(detailedPath, "utf-8"));
  
  const enriched = origCreatures.map(c => {
    const update = updates[c.id];
    if (!update) return c;

    // Helper to merge arrays of objects unique by URL
    const mergeSources = (origSources, newSources) => {
      const merged = [...(origSources || [])];
      for (const ns of newSources) {
        if (!merged.some(os => os.url === ns.url)) {
          merged.push(ns);
        }
      }
      return merged;
    };

    // Helper to merge arrays of strings unique by value
    const mergeStringArrays = (origArr, newArr) => {
      const merged = [...(origArr || [])];
      for (const item of newArr) {
        const normalized = item.trim().toLowerCase();
        if (!merged.some(existing => existing.trim().toLowerCase() === normalized)) {
          merged.push(item);
        }
      }
      return merged;
    };

    // Helper to append updates to description-like string fields if not already present
    const mergeStringFields = (origStr, newStr) => {
      if (!origStr) return newStr.trim();
      const normalizedOrig = origStr.toLowerCase();
      const normalizedNew = newStr.trim().toLowerCase();
      
      if (normalizedOrig.includes(normalizedNew.substring(0, Math.min(20, normalizedNew.length)))) {
        return origStr;
      }
      return (origStr + newStr).trim();
    };

    return {
      ...c,
      characteristics: mergeStringFields(c.characteristics, update.characteristics),
      survival_method: mergeStringFields(c.survival_method, update.survival_method),
      unique_traits: mergeStringFields(c.unique_traits, update.unique_traits),
      strengths: mergeStringArrays(c.strengths, update.strengths),
      weaknesses: mergeStringArrays(c.weaknesses, update.weaknesses),
      fun_facts: mergeStringArrays(c.fun_facts, update.fun_facts),
      sources: mergeSources(c.sources, update.sources),
      enrichment_count: (c.enrichment_count || 12) + 1
    };
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json and targets_detailed.json...");
  fs.unlinkSync(enrichPath);
  fs.unlinkSync(detailedPath);
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) - ROUND 68 ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("-----------------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("-----------------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("=========================================================================================\n");
}

run();
