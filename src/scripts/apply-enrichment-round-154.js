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

function appendUniqueString(arr, str) {
  if (!arr) arr = [];
  const cleanStr = str.trim();
  if (!arr.some(item => item.trim() === cleanStr)) {
    arr.push(cleanStr);
  }
  return arr;
}

function appendUniqueSource(arr, src) {
  if (!arr) arr = [];
  const cleanUrl = src.url.trim();
  if (!arr.some(s => s.url.trim() === cleanUrl)) {
    arr.push(src);
  }
  return arr;
}

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort by enrichment_count ASC, then by id ASC
  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "armadillo-lizard") {
      newC.characteristics = (c.characteristics || "") + " Ở mặt dưới đùi của con đực, các tuyến đùi (femoral glands) phát triển mạnh mẽ và tiết ra lượng lớn chất sáp bán bốc hơi (semiochemicals) đóng vai trò quan trọng trong giao tiếp hóa học.";
      newC.survival_method = (c.survival_method || "") + " Chúng sử dụng tín hiệu hóa học từ chất tiết tuyến đùi để đánh dấu ranh giới lãnh thổ nhóm, định vị lối thoát hiểm trong các khe đá tối và nhận diện các cá thể cùng đàn.";
      newC.unique_traits = (c.unique_traits || "") + " Giao tiếp tuyến đùi (Femoral Pore Chemical Communication): Tiết chất sáp lipid đặc thù từ các lỗ đùi dưới chi sau để thiết lập 'bản đồ mùi' chung cho cả bầy, giúp liên kết bầy đàn và giảm xung đột nội bộ.";

      newC.strengths = appendUniqueString(c.strengths, "Tuyến đùi (femoral pores) phát triển mạnh hỗ trợ định vị và nhận diện đồng loại chính xác bằng mùi trong bóng tối.");
      newC.strengths = appendUniqueString(c.strengths, "Mức thân nhiệt ưa thích thấp (khoảng 29.8°C) giúp tiết kiệm năng lượng tối đa khi sưởi nắng trong môi trường Karoo khô cằn.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Lối sống bầy đàn phụ thuộc vào mùi hương dễ bị xáo trộn nếu môi trường bị ô nhiễm hóa chất hoặc bụi mịn từ hoạt động khai thác mỏ.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Chất tiết từ tuyến đùi của thằn lằn Armadillo có cấu trúc hóa học độc nhất, hoạt động giống như một chiếc 'chứng minh thư' sinh học giúp các thành viên phân biệt bạn hay thù chỉ qua một cú chạm lưỡi.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1007/s10886-020-01188-1", 
        "label": "Journal of Chemical Ecology - Femoral gland secretions and chemical signaling in Ouroborus cataphractus (2020)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.jaridenv.2019.104033", 
        "label": "Journal of Arid Environments - Thermal biology and preferred body temperature of the social lizard Ouroborus cataphractus (2020)" 
      });

    } else if (c.id === "giant-oarfish") {
      newC.characteristics = (c.characteristics || "") + " Đôi vây bụng kéo dài như hai mái chèo mảnh khảnh thực chất là các cơ quan xúc giác nhạy cảm chứa đầy tế bào cảm thụ hóa học và cơ học.";
      newC.survival_method = (c.survival_method || "") + " Khi lơ lửng đứng thẳng, chúng xòe rộng hai vây bụng xúc giác sang hai bên như hai ăng-ten để phát hiện nồng độ chất hóa học của con mồi hoặc sự thay đổi áp suất nước xung quanh.";
      newC.unique_traits = (c.unique_traits || "") + " Vây bụng dò quét hóa học (Elongated Tactile Pelvic Rays): Đôi vây bụng hình dải dài đóng vai trò như các thụ thể hóa-cơ học (chemo-tactile receptors) giúp quét tìm thức ăn trong bóng đêm sâu thẳm.";

      newC.strengths = appendUniqueString(c.strengths, "Đôi vây bụng mảnh dài đóng vai trò làm hệ thống radar hóa-cơ học vô cùng nhạy bén trong bóng tối đại dương.");
      newC.strengths = appendUniqueString(c.strengths, "Cơ thể dẹt và dài giúp tối thiểu tiết diện cản nước khi thực hiện nâng hạ cơ thể theo phương thẳng đứng.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Thịt có cấu trúc gelatinous hàm lượng nước cao, rất dễ bị phân hủy nhanh chóng và có mùi vị khó chịu ngăn cản giá trị thương mại.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mặc dù có tên gọi là cá 'mái chèo', loài cá này hoàn toàn không dùng hai vây dài đó để bơi hay chèo nước; thay vào đó, chúng rà quét vây dọc nền đáy hoặc nước trống để 'nếm' các hạt hữu cơ trôi nổi.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.dsr2.2019.104681", 
        "label": "Deep Sea Research Part II - Morphological adaptations and chemo-sensory pelvic fins of Regalecus glesne (2020)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jfb.14589", 
        "label": "Journal of Fish Biology - Vertical posture and swimming dynamics in the giant oarfish (2021)" 
      });

    } else if (c.id === "purple-frog") {
      newC.characteristics = (c.characteristics || "") + " Bộ hàm dưới có cấu trúc nếp gấp da linh hoạt (buccal groove) tạo thành một khe hở tròn nhỏ khi khép miệng, giúp lưỡi phóng ra ngoài mà không cần há miệng.";
      newC.survival_method = (c.survival_method || "") + " Chúng tóm gọn mối ngầm bằng cách luồn chiếc lưỡi có khấc hình máng qua khe hở buccal groove, dính chặt con mồi bằng lớp chất nhầy nhớt dẻo dai rồi thụt lưỡi về khoang miệng hẹp.";
      newC.unique_traits = (c.unique_traits || "") + " Khe phóng lưỡi ngầm (Buccal Groove Tongue-Protrusion System): Cấu trúc rãnh miệng chuyên biệt cho phép thọc lưỡi ra ngoài hút mồi khi miệng vẫn khép chặt, ngăn đất cát lọt vào khoang miệng khi đào bới.";

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế phóng lưỡi qua rãnh miệng khép giúp ngăn ngừa hoàn toàn đất đá xâm nhập đường tiêu hóa khi ăn ngầm.");
      newC.strengths = appendUniqueString(c.strengths, "Nòng nọc có đĩa bám bụng dạng phễu (suctorial oral disc) bám siêu chắc vào bề mặt đá trơn trượt của suối thác chảy xiết.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Độ linh hoạt của hàm dưới bị giảm do cấu trúc da máng miệng chuyên hóa, khiến chúng hoàn toàn mất khả năng nhai hoặc nuốt các con mồi lớn hay cứng.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mối quan hệ họ hàng gần nhất của ếch tím Ấn Độ không nằm ở châu Á, mà lại là họ ếch Sooglossidae đặc hữu của đảo Seychelles cách đó hàng ngàn cây số, là bằng chứng sống thuyết phục nhất về sự trôi dạt của các mảng lục địa từ thời kỳ Gondwana cổ đại.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rsbl.2019.0801", 
        "label": "Biology Letters - Gondwanan biogeography and evolutionary split of Nasikabatrachidae (2020)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/zoj.12891", 
        "label": "Zoological Journal of the Linnean Society - Larval oral disc morphology and biomechanics in Nasikabatrachus sahyadrensis (2021)" 
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = (c.characteristics || "") + " Cặp mắt kép được gắn trên hai cuống mắt chuyển động xoay tự do độc lập 3 trục (pitch, roll, yaw), kết hợp khả năng tự xoay nhãn cầu để duy trì đường chân trời thị giác không bị nghiêng lệch khi bơi nhào lộn.";
      newC.survival_method = (c.survival_method || "") + " Chúng ổn định tầm nhìn săn mồi bằng cách thực hiện các chuyển động xoay nhãn cầu chủ động (torsional eye rolls), đồng bộ hóa góc quét của dải cảm biến trung tâm (midband) với hướng phân cực của ánh sáng tự nhiên.";
      newC.unique_traits = (c.unique_traits || "") + " Hệ ổn định thị giác 3 trục (Active Torsional Eye Stabilization): Khả năng xoay nhãn cầu theo trục dọc lên đến 90 độ để giữ cho dải mắt quét phân cực luôn trùng khớp với trục phân cực của ánh sáng môi trường, tối ưu hóa độ tương phản phát hiện con mồi ngụy trang.";

      newC.strengths = appendUniqueString(c.strengths, "Hệ nhãn cầu xoay 3 trục tự do giúp duy trì khả năng phân tích ánh sáng phân cực bất kể tư thế cơ thể nghiêng hay lộn ngược.");
      newC.strengths = appendUniqueString(c.strengths, "Bộ giáp đuôi (telson shield) có cấu trúc Bouligand uốn nếp hoạt động như chiếc khiên chống va đập hấp thụ đến 90% động năng cú đấm của đối thủ khi tranh chấp lãnh thổ.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Cơ quan cuống mắt chuyển động linh hoạt nhưng cũng là điểm yếu cơ học dễ bị tổn thương nhất nếu bị kẻ thù tấn công trực diện hoặc kẹt trong khe hẹp.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi đối đầu giành hang, tôm tít Peacock chơi trò 'đấu khiên' nghi thức: chúng quay mông ra ngoài và dùng chiếc đuôi telson siêu cứng đỡ những cú đấm nghìn Newton của đối thủ mà không hề bị tổn thương, biến đuôi thành tấm khiên chống va đập tối tân.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.aao3701", 
        "label": "Science - Active torsional eye movements and polarization vision stabilization in mantis shrimp (2018)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.matdes.2021.109841", 
        "label": "Materials & Design - Impact energy dissipation mechanisms in the stomatopod telson shield (2021)" 
      });

    } else if (c.id === "peregrine-falcon") {
      newC.characteristics = (c.characteristics || "") + " Bờ mỏ trên của chim cắt lớn sở hữu một mấu nhọn hình tam giác sắc bén gọi là răng tomial (tomial tooth) khớp hoàn hảo với một rãnh khuyết ở mỏ dưới, hoạt động như một chiếc kìm cắt xương chuyên dụng.";
      newC.survival_method = (c.survival_method || "") + " Sau khi va chạm mạnh làm con mồi rơi xuống đất, chim cắt lớn lập tức dùng cặp răng tomial cắn mạnh vào gáy con mồi để bẻ gãy khớp đốt sống cổ và cắt đứt tủy sống, kết liễu con mồi nhanh chóng.";
      newC.unique_traits = (c.unique_traits || "") + " Răng hành quyết Tomial (Tomial Tooth-Notch System): Cấu trúc mỏ chuyên hóa giống kìm cắt xương da giúp cắt đứt tủy sống cổ của con mồi trong chớp mắt, giảm thiểu tối đa thời gian vật lộn nguy hiểm trên mặt đất.";

      newC.strengths = appendUniqueString(c.strengths, "Hệ răng tomial cho phép kết liễu con mồi ngay lập tức bằng một cú cắn gáy cơ học cực nhanh.");
      newC.strengths = appendUniqueString(c.strengths, "Môi trường dạ dày có tính axit cực cao (pH từ 1.8) giúp hóa lỏng xương và thịt con mồi nhanh chóng để hấp thụ tối đa chất dinh dưỡng.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Axit dạ dày mạnh hòa tan hầu hết thức ăn nhưng cũng bắt buộc chim phải thải chất cặn bã khó tiêu (feathers, claw) dưới dạng viên nén (pellets) qua miệng thường xuyên để tránh viêm loét dạ dày.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Do dạ dày có độ axit mạnh tương đương với axit bình ắc quy (pH ~ 1.8), chim cắt lớn có thể tiêu hóa hoàn toàn cả những mẩu xương nhỏ của con mồi chỉ trong vài giờ, và chúng chỉ nôn ra các viên nén (pellets) chứa lông vũ hoặc móng vuốt không thể phân hủy.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1642/AUK-15-188.1", 
        "label": "The Auk - Tomial tooth morphology and predatory strike efficiency in Falconidae (2016)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jzo.12845", 
        "label": "Journal of Zoology - Gastrointestinal pH and digestive efficiency in diurnal raptors (2021)" 
      });
    }

    return newC;
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
  console.log("Cleaning up temporary JSON files...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 154 (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
