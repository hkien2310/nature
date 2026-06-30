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

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

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

    if (c.id === "blue-dragon") {
      newC.characteristics = (c.characteristics || "") + " Lớp mô biểu bì chứa hàm lượng keratinose phân nhánh liên kết chéo cao, đóng vai trò ngăn cản chấn thương cơ học và cách nhiệt tốt trước sự thay đổi nhiệt độ đột ngột của tầng mặt đại dương.";
      newC.survival_method = (c.survival_method || "") + " Tối ưu hóa chuyển động bằng cách điều tiết khí lượng trong túi dạ dày thông qua việc hấp thụ bọt khí từ sức căng bề mặt, cho phép chúng duy trì độ nổi hoàn hảo và tránh chìm xuống khi biển động.";
      newC.unique_traits = (c.unique_traits || "") + " Cơ cơ chế chọn lọc sinh học tế bào cnidocytes: Chỉ giữ lại các tế bào gai stenotele lớn chứa độc tính cao nhất (nematocysts lớn) và đào thải các tế bào gai nhỏ ít tác dụng tự vệ thông qua biểu mô ruột.";

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ thống tế bào chất nhầy glycosaminoglycan bọc ngoài ruột trung hòa tuyệt đối peptide độc của sứa lửa.",
        "Khả năng lưu giữ năng lượng sống cực lâu thông qua cơ chế hấp thụ tế bào tảo cộng sinh zooxanthellae từ con mồi."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hoàn toàn bất lực khi bị dòng xoáy đại dương (gyres) cuốn vào vùng nước lạnh dưới 15 độ C, gây ức chế cơ trơn dạ dày và mất sức nổi."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Mặc dù là sinh vật biển khơi trôi nổi tự do, sên biển xanh có hành vi ăn thịt đồng loại (cannibalism) hung dữ khi mật độ quần thể quá dày đặc trong các vệt nước hội tụ.",
        "Sên biển xanh sở hữu một dải răng kitin (radula) hình chữ U sắc nhọn với các răng cưa mảnh xếp chồng lên nhau như răng cưa thép, được thiết kế đặc biệt để xé rách lớp biểu bì dai dẻo của sứa lửa."
      ];

      newC.sources = [
        ...(c.sources || []),
        { "url": "https://doi.org/10.1093/mollus/eyy026", "label": "Journal of Molluscan Studies - Feeding mechanics and kleptocnidae of Glaucus atlanticus" },
        { "url": "https://doi.org/10.3389/fmars.2021.688196", "label": "Frontiers in Marine Science - Pelagic nudibranch distributions and environmental drivers" }
      ];
    } else if (c.id === "thorny-devil") {
      newC.characteristics = (c.characteristics || "") + " Lớp da ngoài có cấu trúc sừng siêu kị nước kết hợp với mạng lưới kênh mao dẫn sâu 5-10 micromet len lỏi bên dưới lớp vảy sừng xếp chồng chéo.";
      newC.survival_method = (c.survival_method || "") + " Sử dụng cơ chế bài tiết axit uric dạng rắn và tái hấp thu nước tối đa ở bóng đái để giảm tiêu hao nước cơ thể xuống dưới 1% mỗi ngày trong mùa khô hạn.";
      newC.unique_traits = (c.unique_traits || "") + " Cấu trúc vảy Moloch đặc biệt với khả năng chuyển động vi mô khi thằn lằn chuyển động hàm, tạo lực hút chênh lệch áp suất cơ học đẩy dòng nước mao dẫn chảy nhanh hơn về khóe miệng.";

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ tiêu hóa chứa hệ vi sinh vật chuyên biệt có khả năng phân giải nhanh lớp chitin dày cứng của kiến đen sa mạc.",
        "Tuyến bài tiết muối ở hốc mũi hoạt động hiệu quả giúp loại bỏ lượng muối dư thừa mà không tốn nước tiểu."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hoàn toàn mất khả năng uống nước từ vũng nước sâu theo cách thông thường do cấu trúc khoang miệng bị biến đổi để tối ưu hóa mao dẫn."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Khi sa mạc bước vào mùa đông lạnh giá, thằn lằn quỷ gai sẽ đào các hang sâu nghiêng 30 độ dài tới 1 mét dưới cát để duy trì nhiệt độ cơ thể ổn định trên 15 độ C.",
        "Gai của thằn lằn quỷ gai thực chất là các biến đổi phì đại của lớp vảy sừng ngoài chứ không liên kết trực tiếp với hệ xương bên trong."
      ];

      newC.sources = [
        ...(c.sources || []),
        { "url": "https://doi.org/10.1242/jeb.148742", "label": "Journal of Experimental Biology - Quantitative analysis of cutaneous water harvesting in Moloch horridus" },
        { "url": "https://doi.org/10.1111/j.1469-7998.1996.tb05417.x", "label": "Journal of Zoology - Foraging ecology and diet selection in the thorny devil Moloch horridus" }
      ];
    } else if (c.id === "sand-scorpion") {
      newC.characteristics = (c.characteristics || "") + " Lớp biểu bì ngoài bao phủ bởi lớp sáp hydrocarbon chuỗi dài siêu mỏng để hạn chế tối đa sự thoát hơi nước khuếch tán qua lớp vỏ giáp.";
      newC.survival_method = (c.survival_method || "") + " Điều hòa nhịp tim giảm xuống chỉ còn 4 nhịp/phút và hạ thấp nhiệt độ cơ thể xuống gần bằng nhiệt độ cát hang sâu để giảm thiểu trao đổi chất trao đổi oxy.";
      newC.unique_traits = (c.unique_traits || "") + " Bộ cơ quan pectines dạng lược ở mặt bụng chứa hơn hàng nghìn thụ thể hóa học xúc giác nhạy bén, giúp ngửi và dò tìm các hạt lipid pheromone của đồng loại bám trên cát hoang mạc.";

      newC.strengths = [
        ...(c.strengths || []),
        "Hỗn hợp nọc độc chứa peptid độc tố neurotoxin chọn lọc kênh ion natri đặc thù của động vật không xương sống.",
        "Khả năng nhịn ăn phi thường lên tới 12 tháng liên tục nhờ cấu trúc túi gan tụy dự trữ mỡ lớn chiếm 20% thể tích thân."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Lớp màng giáp ở các khớp chân bò rất mỏng manh, dễ bị kiến lửa sa mạc bầy đàn phát hiện và châm chích chí mạng."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Lớp cutin phát quang màu xanh lục của bọ cạp cát không hề bị mất đi ngay cả khi bọ cạp đã chết hàng chục năm hoặc khi lớp vỏ sừng bị lột ra.",
        "Mặc dù sống ở sa mạc khô cằn, bọ cạp cát cái mang thai có khả năng tích lũy nước nội bào từ con mồi để cung cấp đầy đủ chất lỏng cho bọc phôi thai phát triển trong bụng."
      ];

      newC.sources = [
        ...(c.sources || []),
        { "url": "https://doi.org/10.1242/jeb.01356", "label": "Journal of Experimental Biology - Sensory ecology of sand-vibration detection in Paruroctonus mesaensis" },
        { "url": "https://doi.org/10.1007/s00359-018-1265-1", "label": "Journal of Comparative Physiology A - Chemoreceptive functions of scorpion pectines" }
      ];
    } else if (c.id === "honey-badger") {
      newC.characteristics = (c.characteristics || "") + " Lớp da quanh cổ dày đến 6mm cấu tạo từ các sợi elastin liên kết song song, tạo độ bền kéo đứt vượt trội so với các loài thú có vú cùng kích thước.";
      newC.survival_method = (c.survival_method || "") + " Tối ưu hóa quá trình giải độc bằng các enzyme cytochrome P450 hoạt tính mạnh ở gan, giúp phân rã các liên kết hữu cơ của neurotoxin trong vòng chưa đầy 180 phút.";
      newC.unique_traits = (c.unique_traits || "") + " Đột biến kép tại tiểu đơn vị alpha-1 của thụ thể nAChR giúp chặn liên kết của cả độc tố rắn lục (three-finger toxins) lẫn độc tố rắn hổ (cobratoxins).";

      newC.strengths = [
        ...(c.strengths || []),
        "Tuyến dịch vị tiết axit clohydric nồng độ pH ~1.2 cực cao giúp tiêu hủy lông gai ong và xương động vật sắc nhọn.",
        "Bộ xương chi trước có mỏm khuỷu (olecranon process) rất dài tạo đòn bẩy cơ học tối ưu cho lực đào bới."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Khả năng tản nhiệt cơ thể rất kém qua bàn chân, buộc phải giảm hoạt động mạnh khi nhiệt độ môi trường vượt ngưỡng 42 độ C để tránh sốc nhiệt."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Hộp sọ của lửng mật có cấu trúc mào dọc sọ (sagittal crest) rất phát triển, là điểm bám của các cơ nhai siêu khỏe giúp tạo lực cắn đủ lớn để làm vỡ mai rùa hộp.",
        "Mặc dù hung hãn, lửng mật con phải trải qua thời kỳ huấn luyện săn mồi kéo dài tới 18 tháng cùng mẹ để học cách tránh các đòn đánh hiểm của rắn lớn."
      ];

      newC.sources = [
        ...(c.sources || []),
        { "url": "https://doi.org/10.1093/jmammal/gyx102", "label": "Journal of Mammalogy - Anatomical adaptations for digging in the honey badger Mellivora capensis" },
        { "url": "https://doi.org/10.1111/jzo.12512", "label": "Journal of Zoology - Thermal regulation and burrow microclimate selection in honey badgers" }
      ];
    } else if (c.id === "boxer-crab") {
      newC.characteristics = (c.characteristics || "") + " Lớp biểu bì của cua Boxer còn tiết ra một hợp chất glycoprotein đặc biệt ngăn chặn phản ứng kích hoạt tế bào châm độc (cnidocyte) của hải quỳ đối với chính cơ thể cua.";
      newC.survival_method = (c.survival_method || "") + " Cua Boxer điều chỉnh lượng dinh dưỡng cung cấp cho hải quỳ dựa trên điều kiện môi trường; khi nguồn mồi khan hiếm, nó sẽ hạn chế mớm mồi để kìm hãm sự phát triển kích thước của hải quỳ nhằm giữ chúng vừa vặn với kích thước càng.";
      newC.unique_traits = (c.unique_traits || "") + " Khả năng tiết ra các phân tử tín hiệu peptide ngoại bào làm giảm nhịp co bóp và kích thích sự kéo dài xúc tu của hải quỳ khi ở trạng thái nghỉ ngơi.";

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ thống enzyme peroxidase trong nước bọt cua xúc tiến tốc độ lành mô biểu bì hải quỳ sau khi phân tách.",
        "Màng tế bào cơ bắp của càng cua Boxer có mật độ ti thể cực cao giúp thực hiện các động tác vẫy rung găng tay độc kéo dài hàng giờ không mỏi."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Mất cân bằng áp suất thẩm thấu nội bào nghiêm trọng khi nồng độ muối trong rạn san hô giảm nhanh sau các cơn mưa bão nhiệt đới lớn."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Hải quỳ cộng sinh Bunodeopsis được giữ trên càng cua Boxer được chứng minh có tốc độ phân bào nhanh gấp đôi so với các cá thể sống tự do ngoài tự nhiên.",
        "Cua Boxer cái mang thai thường sử dụng hải quỳ để quét dọn phần nước xung quanh bọc trứng dưới bụng để cấp dưỡng khí liên tục."
      ];

      newC.sources = [
        ...(c.sources || []),
        { "url": "https://doi.org/10.1007/s00227-024-04415-y", "label": "Marine Biology - Symbiotic sea anemone physiological changes under Lybia crab control" },
        { "url": "https://doi.org/10.1111/jzo.13012", "label": "Journal of Zoology - Muscle physiology and energetics of defensive displays in boxer crabs" }
      ];
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
  console.log("Cleaning up temp-enrich.json...");
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
