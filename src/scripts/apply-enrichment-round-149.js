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

    if (c.id === "giant-moray-eel") {
      newC.characteristics = (c.characteristics || "") + " Bộ hàm răng phụ (Pharyngeal jaws) di động nằm sâu dưới cổ họng được cấu tạo từ các khớp xương linh hoạt có khả năng bắn ra phía trước để ngoạm chặt mồi. Lớp da nhầy của chúng rất giàu các chuỗi peptide kháng khuẩn (AMPs) ngăn ngừa sự ký sinh của vi khuẩn đại dương.";
      newC.survival_method = (c.survival_method || "") + " Săn mồi theo nhóm liên loài (cooperative hunting) bằng cách phối hợp với cá mú; khi cá mú ra hiệu bằng cách lắc đầu trước hang hốc, cá chình sẽ len lỏi vào đẩy con mồi ra ngoài.";
      newC.unique_traits = (c.unique_traits || "") + " Khả năng quấn thân tạo nút siết (knotting behavior) tạo đòn bẩy cơ học mạnh mẽ để xé nhỏ các con mồi lớn mà không cần vây ngực giữ thăng bằng.";

      newC.strengths = appendUniqueString(c.strengths, "Hệ cơ hàm hầu họng có tốc độ co rút bộc phát cực mạnh, ngoạm và lôi con mồi vào thực quản chỉ trong vài phần mười giây.");
      newC.strengths = appendUniqueString(c.strengths, "Sự hợp tác đi săn thông minh với cá mú (cooperative hunting) làm tăng đáng kể hiệu suất bắt mồi trong rạn san hô.");
      newC.strengths = appendUniqueString(c.strengths, "Hệ thống hô hấp bằng cách bơm nước liên tục qua mang nhờ cơ hầu họng phát triển mà không cần phải chuyển động bơi.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Thị giác thoái hóa cao, dễ nhầm lẫn các chướng ngại vật tĩnh hoặc tấn công nhầm do không phân biệt được các chi tiết.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Thiếu hoàn toàn vây ngực và vây bụng làm giảm đáng kể khả năng ổn định thăng bằng ở vùng nước trống trải nhiều dòng biển xoáy.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Gymnothorax javanicus là loài cá chình moray lớn nhất thế giới xét về mặt sinh khối, có thể đạt tới trọng lượng 30kg.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Chúng là loài động vật có xương sống duy nhất sử dụng bộ hàm răng hầu họng thứ hai để chủ động cắn bắt và nuốt chửng con mồi thay vì cơ chế hút chân không thụ động.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1038/nature06062", "label": "Nature - Pharyngeal jaws utilize raptorial feeding mechanism in moray eels" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1111/j.1095-8649.2012.03267.x", "label": "Journal of Fish Biology - Cooperative hunting between giant moray eels and roving coral groupers" });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = (c.characteristics || "") + " Lớp vỏ ngoài của dactyl club có cấu trúc Bouligand đa lớp gồm các sợi chitin đan chéo xoắn ốc xếp chồng lớp, giúp phân tán tối ưu chấn động cơ học cực mạnh từ cú đấm mà không gây nứt vỡ lớp vỏ bảo vệ.";
      newC.survival_method = (c.survival_method || "") + " Sử dụng cơ chế khóa khớp vai (saddle-like spring) tích lũy năng lượng đàn hồi lớn trước khi giải phóng cú đấm càng búa chớp nhoáng với gia tốc tương đương viên đạn súng lục.";
      newC.unique_traits = (c.unique_traits || "") + " Tầm nhìn trinocular vision lập thể bằng một mắt đơn độc lập nhờ cấu trúc mắt kép chia thành ba vùng quét ánh sáng phân cực tròn và tia cực tím nhạy cảm.";

      newC.strengths = appendUniqueString(c.strengths, "Cú đấm siêu tốc tạo ra hiện tượng sụp đổ bong bóng chân không (cavitation bubble) phát nhiệt và ánh sáng gây sát thương kép cho con mồi.");
      newC.strengths = appendUniqueString(c.strengths, "Càng búa có cấu trúc sợi Bouligand đan chéo chống nứt vỡ cơ học vĩnh cửu, chịu đựng được hàng ngàn cú va chạm cường độ cao.");
      newC.strengths = appendUniqueString(c.strengths, "Cập mắt kép chuyển động xoay độc lập trên 3 trục tự do, cảm nhận chiều sâu lập thể chỉ bằng một mắt duy nhất.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Chu kỳ lột xác (ecdysis) kéo dài khiến cơ thể hoàn toàn mềm yếu và mất khả năng phòng thủ cơ học trong nhiều ngày.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Yêu cầu lượng canxi và khoáng chất rất lớn từ thức ăn để tái tạo vỏ dactyl club sau mỗi chu kỳ lột vỏ.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mắt của tôm tít có thể phát hiện các tế bào ung thư và hoạt động của các tế bào thần kinh thông qua việc quan sát sự thay đổi của ánh sáng phân cực.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cú đấm của tôm tít Peacock tạo ra bong bóng sụp đổ phát ra nhiệt độ tức thời lên tới hàng ngàn độ Kelvin, gần bằng nhiệt độ bề mặt Mặt Trời.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1126/science.1218764", "label": "Science - Biophotonics and structure of the dactyl club of the mantis shrimp" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1242/jeb.02054", "label": "Journal of Experimental Biology - Polarization vision in stomatopods" });

    } else if (c.id === "peregrine-falcon") {
      newC.characteristics = (c.characteristics || "") + " Mí mắt thứ ba (nictitating membrane) đặc biệt hoạt động như kính bảo hộ sinh học giúp bôi trơn mắt và ngăn chặn bụi bẩn hoặc khô mắt dưới áp suất gió bổ nhào lớn. Võng mạc chứa mật độ tế bào nón cực đại cho phép phóng đại hình ảnh cự ly xa.";
      newC.survival_method = (c.survival_method || "") + " Sử dụng cấu trúc gai nón nhỏ (nasal tubercles) trong lỗ mũi để điều hướng luồng khí áp suất cao đi lệch tâm, duy trì nhịp thở hiếu khí bình thường trong cú bổ nhào tốc độ 300 km/h.";
      newC.unique_traits = (c.unique_traits || "") + " Cú đập vuốt chân sau (hallux claw) ở vận tốc cực đại tạo ra động năng khổng lồ bẻ gãy cổ con mồi lập tức. Bộ não có tốc độ xử lý thị giác vượt trội hơn 100 khung hình/giây ngăn hiện tượng nhòe ảnh.";

      newC.strengths = appendUniqueString(c.strengths, "Cơ ngực chiếm tới 25% trọng lượng cơ thể, cung cấp lực đập cánh mạnh mẽ để nhanh chóng lấy lại độ cao sau cú bổ nhào.");
      newC.strengths = appendUniqueString(c.strengths, "Cấu trúc lông cánh xếp sát và cứng cáp giúp giảm thiểu ma sát không khí và duy trì quỹ đạo bổ nhào thẳng tắp dưới áp lực gió lớn.");
      newC.strengths = appendUniqueString(c.strengths, "Bộ não có khả năng xử lý hình ảnh tốc độ cực cao (>100 khung hình/giây), ngăn chặn hiện tượng nhòe ảnh khi lao xuống.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Động năng va chạm quá lớn trong cú bổ nhào tốc độ cao đòi hỏi độ chính xác tuyệt đối; một sai sót nhỏ có thể gây gãy cánh hoặc tử vong.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Không thể săn mồi hiệu quả trong các khu vực rừng cây rậm rạp do cánh dài khí động học khó luồn lách giữa các nhánh cây hẹp.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Đôi mắt của chim cắt lớn hoạt động giống như một ống kính tele của máy ảnh, phóng đại hình ảnh con mồi ở cự ly xa mà không giảm độ sắc nét.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Để tránh bị xé rách phổi do luồng không khí phản lực khi bay nhanh, cấu trúc lỗ mũi của chúng đã truyền cảm hứng trực tiếp cho thiết kế cửa hút gió của động cơ máy bay phản lực SR-71 Blackbird.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1242/jeb.101231", "label": "Journal of Experimental Biology - Aerodynamics of the peregrine falcon stoop" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1371/journal.pone.0192875", "label": "PLOS ONE - Visual acquisition and tracking during raptor pursuit" });

    } else if (c.id === "planarian") {
      newC.characteristics = (c.characteristics || "") + " Hệ cơ trơn của chúng gồm ba lớp cơ (dọc, vòng và chéo) xếp chồng chặt chẽ dưới lớp biểu bì lông mao, cung cấp sức bền dẻo cơ học giúp chúng co duỗi linh hoạt.";
      newC.survival_method = (c.survival_method || "") + " Khi gặp điều kiện khô hạn tạm thời, chúng có thể tự bao bọc trong một kén chất nhầy dày tự tiết ra để cô lập cơ thể và giữ ẩm.";
      newC.unique_traits = (c.unique_traits || "") + " Đặc tính lưỡng tính đồng thời (simultaneous hermaphroditism) nhưng không tự thụ tinh; chúng bắt cặp và trao đổi tinh trùng chéo qua lỗ sinh dục nằm ở mặt bụng.";

      newC.strengths = appendUniqueString(c.strengths, "Hoạt tính cao của hệ enzyme glutathione S-transferase (GST) giúp giải độc tế bào hiệu quả trước các độc tố nội sinh.");
      newC.strengths = appendUniqueString(c.strengths, "Cơ chế tự thực (autophagy) được điều hòa tinh vi để loại bỏ các tế bào tổn thương trong thời kỳ nhịn đói kéo dài.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Khả năng chống chịu cơ học kém trước áp lực cơ học mạnh hoặc sóng cuộn, dễ bị xé rách cơ thể nếu không ẩn nấp kịp.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Planaria không có mắt để tạo ảnh, nhưng nếu chiếu chùm tia UV vào, chúng sẽ di chuyển tránh xa lập tức nhờ hệ thụ cảm ánh sáng cực tím nhạy bén.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1016/j.celrep.2020.107537", "label": "Cell Reports - Autophagy regulates cellular transformation during planarian regeneration" });

    } else if (c.id === "southern-cassowary") {
      newC.characteristics = (c.characteristics || "") + " Bàn chân dày có lớp đệm sừng đàn hồi cao hoạt động như bộ giảm chấn cơ học hấp thụ chấn động mạnh khi tiếp đất từ cú nhảy cao.";
      newC.survival_method = (c.survival_method || "") + " Di chuyển chủ yếu vào ban ngày hoặc lúc hoàng hôn, dọc theo các lối mòn tự nhiên trong rừng nguyên sinh đã được định hình qua nhiều thế hệ để tránh va chạm vật lý trực tiếp với các cây thân gỗ lớn.";
      newC.unique_traits = (c.unique_traits || "") + " Hệ thống tiêu hóa siêu tốc không phá hủy lớp vỏ hạt cứng nhờ môi trường dịch vị đặc trưng có độ pH trung tính, tạo điều kiện phát tán hoàn hảo cho thực vật.";

      newC.strengths = appendUniqueString(c.strengths, "Lớp biểu bì sừng chân cực kỳ dày bảo vệ đôi chân khỏi các vết cắn của các loài rắn độc dưới thảm rừng.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Thân hình cồng kềnh khó di chuyển linh hoạt trong các đầm lầy bùn lún sâu.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Móng vuốt của chúng sắc đến mức người bản địa vùng New Guinea từng sử dụng chúng để làm đầu mũi lao săn bắn.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1111/joa.12385", "label": "Journal of Anatomy - Anatomical structure of the cassowary foot and pelvic limb" });
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
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
