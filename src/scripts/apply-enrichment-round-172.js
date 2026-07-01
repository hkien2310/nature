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

function appendClean(currentText, newText) {
  if (!currentText) return newText.trim();
  const cleanCurrent = currentText.trim();
  const cleanNew = newText.trim();
  if (cleanCurrent.includes(cleanNew)) {
    return cleanCurrent;
  }
  return cleanCurrent + " " + cleanNew;
}

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

    if (c.id === "blue-ringed-octopus") {
      newC.characteristics = appendClean(c.characteristics, "Lớp da nhẵn của chúng có chứa các tế bào phản quang iridophores chứa cấu trúc tinh thể protein reflectin xếp lớp, giúp phản xạ bước sóng ánh sáng màu xanh lam rực rỡ (khoảng 480 nm) khi cơ vòng sắc tố co rút mở rộng đốm.");
      newC.survival_method = appendClean(c.survival_method, "Khi săn mồi, chúng cắn và phóng ra dòng nước bọt chứa độc tố TTX thẩm thấu trực tiếp qua vỏ bọc tế bào của con mồi hoặc qua vết cắn nhỏ. Đồng thời, chúng có thể nén cơ thể mềm dẻo đi qua những khe nứt có kích thước chỉ bằng một phần ba đường kính thân.");
      newC.unique_traits = appendClean(c.unique_traits, "Độc tố Tetrodotoxin (TTX) tích trữ trong tuyến nước bọt sau và các mô cơ thể được tổng hợp bởi các dòng vi khuẩn cộng sinh thuộc chi Vibrio, Bacillus và Pseudomonas. TTX liên kết chọn lọc và khóa chặt các kênh natri phụ thuộc điện thế (voltage-gated sodium channels - Nav) trên tế bào thần kinh, cắt đứt hoàn toàn xung động dẫn truyền cơ vận động.");

      newC.strengths = appendUniqueString(c.strengths, "Sở hữu độc tố thần kinh Tetrodotoxin cực mạnh có khả năng khóa chặt kênh natri trên màng tế bào, làm tê liệt tức thì hệ thống hô hấp.");
      newC.strengths = appendUniqueString(newC.strengths, "Hệ thống tế bào sắc tố bào (chromatophores) và tế bào phản quang (iridophores) giúp ngụy trang hoàn hảo và phát tín hiệu cảnh báo siêu tốc.");
      newC.strengths = appendUniqueString(newC.strengths, "Cơ thể mềm dẻo không xương cho phép luồn lách qua các khe đá hẹp nhỏ hơn 3 lần đường kính thân.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Không có cấu trúc xương hay giáp cứng bảo vệ, cực kỳ dễ bị tổn thương vật lý trước cá ăn thịt có răng sắc nhọn.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Nhạy cảm với sự gia tăng nhiệt độ nước biển làm mất ổn định hệ vi sinh vật cộng sinh sản sinh độc tố.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Bạch tuộc đốm xanh là một trong số ít loài nhuyễn thể biển sử dụng vi khuẩn cộng sinh làm nguồn sản xuất chất độc sinh học chính thay vì tự tổng hợp.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Đốm vòng xanh của chúng không phát sáng bằng hóa học (bioluminescence) mà do sự phản xạ quang học vật lý từ các lớp tinh thể reflectin xếp chồng bên trong iridophores.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2012.04.341",
        "label": "Toxicon - Tetrodotoxin distribution and bacterial symbiosis in Hapalochlaena"
      });

    } else if (c.id === "gear-planthopper") {
      newC.characteristics = appendClean(c.characteristics, "Khớp đùi chân sau ở giai đoạn nhộng có cấu trúc bánh răng cơ học sinh học (trochanteral gears) với 10-12 răng cưa xếp ăn khớp, có biên dạng xoắn thân khai (involute profile) tương tự các bánh răng trong hộp số cơ khí.");
      newC.survival_method = appendClean(c.survival_method, "Nén năng lượng đàn hồi vào cấu trúc vòm ngực làm từ composite protein resilin-chitin siêu đàn hồi, giải phóng lực bật nhảy cực mạnh và đồng bộ hóa hai chân sau qua khớp bánh răng cơ học với sai số thời gian dưới 30 micro giây.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu bộ bánh răng cơ học đầu tiên được phát hiện trong sinh giới, có các góc lượn (fillet) ở chân răng giúp phân tán ứng lực tập trung và ngăn ngừa hiện tượng mỏi, nứt gãy vật liệu.");

      newC.strengths = appendUniqueString(c.strengths, "Đồng bộ hóa lực nhảy hai chân sau nhờ hệ bánh răng cơ sinh học giúp bật nhảy với gia tốc 400g mà không bị lệch hướng.");
      newC.strengths = appendUniqueString(newC.strengths, "Vòm ngực chứa protein resilin cho phép tích trữ và giải phóng năng lượng cơ học đàn hồi cao hơn bất kỳ cơ bắp thông thường nào.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Bộ bánh răng chỉ tồn tại ở giai đoạn nhộng, khi trưởng thành cấu trúc này bị tiêu biến làm giảm khả năng đồng bộ tuyệt đối.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Nhạy cảm với các loại thuốc trừ sâu hóa học nhắm vào lớp cutin mỏng của giai đoạn nhộng.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Biên dạng bánh răng của nhộng Issus coleoptratus hoàn toàn tương thích với biên dạng bánh răng thân khai được sử dụng trong ngành chế tạo máy hiện đại.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Khớp bánh răng này chỉ hoạt động ở các giai đoạn nhộng phát triển; ở giai đoạn trưởng thành, cơ chế đồng bộ được thay thế bằng một bề mặt ma sát thô.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1126/science.1240284",
        "label": "Science - Interacting Gears Synchronize Propulsive Jumps in Bugs"
      });

    } else if (c.id === "orca") {
      newC.characteristics = appendClean(c.characteristics, "Cơ thể thuôn dài hình thủy động lực học tối ưu, sở hữu hàm răng hình nón sắc nhọn ngậm khớp chéo và lớp mỡ dưới da dày tới 10 cm giúp giữ ấm ở vùng biển băng giá và dự trữ năng lượng.");
      newC.survival_method = appendClean(c.survival_method, "Săn mồi theo bầy đàn (pods) dẫn dắt bởi con cái đầu đàn. Sử dụng cơ quan dưa hấu (melon organ) ở trán để hội tụ sóng âm định vị (echolocation) tần số cao, phát hiện con mồi ẩn náu và giao tiếp bằng ngôn ngữ vùng miền phức tạp.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu bộ não lớn thứ hai trong giới động vật có vú với chỉ số thông minh (EQ) cao, có khả năng truyền tải văn hóa săn mồi liên thế hệ, dạy con non các chiến thuật như lật ngửa cá mập để gây bất động trương lực (tonic immobility).");

      newC.strengths = appendUniqueString(c.strengths, "Trí thông minh xã hội vượt trội cho phép phát triển và truyền thụ các chiến thuật săn mồi phức tạp.");
      newC.strengths = appendUniqueString(newC.strengths, "Cơ thể thủy động lực học lực lưỡng kết hợp với cơ hàm cực khỏe tạo lực va chạm vật lý khổng lồ.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Nhạy cảm với tiếng ồn tần số thấp từ tàu thuyền quân sự gây nhiễu loạn sóng siêu âm định vị.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Tính chuyên hóa thức ăn cực cao ở một số quần thể (chỉ ăn cá hồi hoặc chỉ ăn hải cẩu) làm tăng nguy cơ tuyệt chủng cục bộ.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Orca có cấu trúc xã hội mẫu hệ chặt chẽ, nơi con cái đầu đàn lớn tuổi nhất chịu trách nhiệm lưu trữ 'bản đồ tri thức' về các bãi săn và truyền dạy cho con cháu.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chúng có khả năng bắt chước âm thanh của các loài khác, kể cả tiếng huýt của cá heo mũi chai và một số từ đơn giản của con người.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1111/j.1748-7692.1998.tb00693.x",
        "label": "Marine Mammal Science - Cultural transmission and foraging ecology of Killer Whales"
      });

    } else if (c.id === "blue-dragon") {
      newC.characteristics = appendClean(c.characteristics, "Hệ thống túi khí trong dạ dày cho phép chúng tự động duy trì lực nổi sinh học mà không cần vận động cơ học để tiết kiệm năng lượng.");
      newC.survival_method = appendClean(c.survival_method, "Chất nhờn chuyên biệt bao phủ niêm mạc miệng và dạ dày hoạt động như lớp màng nhầy cơ học ngăn chặn sự phóng ngòi độc từ thức ăn sứa lửa.");
      newC.unique_traits = appendClean(c.unique_traits, "Khả năng tái định vị các tế bào châm độc chưa phóng (nematocysts) di chuyển qua thành ống tiêu hóa phân nhánh của chúng lên các tế bào cnidosac chuyên biệt ở rìa cerata mà không làm kích hoạt phản xạ phóng độc.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng chịu đựng nồng độ độc tố peptide trong sứa lửa mà không bị hoại tử tế bào dạ dày.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng tiết ra lớp chất nhầy ngăn tế bào châm phóng độc.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Khi sụt giảm sức căng bề mặt của nước (do vết dầu loang hoặc xà phòng), chúng mất lực nâng và dễ bị chìm chết ngạt.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cơ quan sinh dục của loài sên này tiến hóa dài và cong bất thường để có thể tiếp cận bạn tình mà không bị châm bởi các xúc tu chứa đầy nọc độc sứa lửa của đối phương.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1093/mollus/eyy058",
        "label": "Journal of Molluscan Studies - Cleptocnidae and feeding ecology of Glaucus"
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Càng đập cấu tạo từ các lớp khoáng chất hydroxyapatite xếp xen kẽ lớp sợi chitin đàn hồi giúp hấp thụ lực va đập mà không gãy.");
      newC.survival_method = appendClean(c.survival_method, "Khi gia cố hang, chúng sử dụng cú đập búa tạ để đập vỡ đá san hô thành các mảnh vụn nhỏ, rồi dùng chân hàm xếp chúng làm tường bảo vệ chống xói mòn.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu bộ càng búa tạ cấu trúc composite nano xếp xoắn ốc (helicoidal) hấp thụ 90% lực phản chấn.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phát hiện ánh sáng phân cực tuyến tính giúp định vị kẻ thù ẩn mình dưới lớp san hô phản xạ.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Phần cựa nén dải gân yên ngựa dễ bị xơ hóa và giảm 30% hiệu năng lưu trữ đàn hồi khi tôm tít già đi hoặc bị thiếu hụt nguyên tố vi lượng manganese.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mặc dù sở hữu cú đấm hủy diệt, tôm tít búa tạ rất hạn chế đập nhau trực tiếp bằng càng khi tranh chấp hang; thay vào đó, chúng quay lưng giơ đuôi bọc giáp dày (telson) để chịu đòn của đối thủ như một màn đo sức bền.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1126/science.1100460",
        "label": "Science - Elastic Energy Storage in Mantis Shrimp"
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
  console.log("Cleaning up temporary JSON file...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 172 ===================");
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
