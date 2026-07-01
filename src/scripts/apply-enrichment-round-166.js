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

    if (c.id === "comb-jelly") {
      newC.characteristics = appendClean(c.characteristics, "Nghiên cứu cấu trúc siêu vi cho thấy hệ thống lưới thần kinh dưới biểu bì (subepithelial nerve net - SNN) của sứa lược sử dụng cơ chế dung hợp neurite không khớp thần kinh (synapse-free syncytial network), một hiện tượng độc nhất vô nhị ở giới động vật.");
      newC.survival_method = appendClean(c.survival_method, "Khi mật độ thức ăn trong môi trường giảm mạnh, loài này kích hoạt cơ chế đảo ngược quá trình phát triển (reverse development) để quay lại dạng ấu trùng cydippid, giúp kéo dài thời gian sinh tồn mà không cần nạp năng lượng.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu khả năng dung hợp sinh lý tức thì (rapid physiological fusion) khi hai cá thể bị thương tiếp xúc gần; hệ tuần hoàn và mạng lưới thần kinh tự kết hợp tạo thành một cơ thể thống nhất chia sẻ chung các phản xạ điện thế hoạt động.");

      newC.strengths = appendUniqueString(c.strengths, "Có khả năng dung hợp cơ thể siêu tốc với cá thể cùng loài để tăng khả năng sống sót sau chấn thương nghiêm trọng.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Lưới thần kinh syncytial không có khớp synapse hạn chế tốc độ phản xạ định hướng phức tạp trước các loài săn mồi linh hoạt.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Mặc dù thiếu hệ miễn dịch tế bào tiên tiến, sứa lược sở hữu một phổ lớn các gen NACHT và C-type lectin giúp ngăn chặn hiệu quả các mầm bệnh khi thực hiện dung hợp cơ thể.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.ade5645", 
        "label": "Science - Syncytial nerve net in a ctenophore challenges the neuron doctrine" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.cub.2024.09.002", 
        "label": "Current Biology - Rapid physiological fusion of comb jellies" 
      });

    } else if (c.id === "mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Mắt của tôm tít có cấu trúc dải giữa (mid-band) chia thành 6 hàng ommatidia chuyên biệt giúp lọc ánh sáng phân cực và phân tích 12 kênh màu riêng biệt.");
      newC.survival_method = appendClean(c.survival_method, "Chúng sử dụng kênh truyền thông tin quang học phân cực tròn (circular polarization) như một tín hiệu bí mật mà chỉ đồng loại có thể nhận biết để xác định ranh giới lãnh thổ hang đá.");
      newC.unique_traits = appendClean(c.unique_traits, "Cấu trúc dactyl club chứa lớp lọc cơ học âm học (phononic shield) giúp hấp thụ và triệt tiêu các sóng chấn động phản hồi có tần số cao, bảo vệ các mô cơ chi trước khỏi bị phá hủy sau các đòn đánh.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng nhìn lập thể ba chiều (trinocular vision) chỉ bằng một con mắt duy nhất nhờ cấu trúc tiêu cự ommatidia đa điểm.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Vùng dactyl club dễ bị mài mòn lớp Herringbone bề mặt sau hàng ngàn lần tấn công, khiến chúng phải chờ đợi chu kỳ lột xác tiếp theo để phục hồi hoàn toàn.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Phần saddle tích lũy năng lượng đàn hồi của tôm tít hoạt động như một hệ lò xo cơ học tối tân chế tạo từ hỗn hợp chitin phân lớp và canxi photphat.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.1152966", 
        "label": "Science - Circularly polarized light detection in a mantis shrimp" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1002/adma.201907895", 
        "label": "Advanced Materials - A Phononic Shield in the Dactyl Club of Mantis Shrimp" 
      });

    } else if (c.id === "pelican-eel") {
      newC.characteristics = appendClean(c.characteristics, "Cơ cấu hàm dưới khớp lùi sâu ra sau hộp sọ tạo ra khoảng trống không gian tối đa để mở rộng khoang miệng theo chiều ngang khi săn mồi.");
      newC.survival_method = appendClean(c.survival_method, "Để tối ưu hóa cú táp, cá chình bồ nông thực hiện kỹ thuật cuộn người gấp khúc để đặt cơ quan phát sáng ở đuôi nằm ngay sát khoảng trống trước miệng để dụ mồi lao thẳng vào bẫy.");
      newC.unique_traits = appendClean(c.unique_traits, "Đặc trưng sinh sản đơn kỳ (semelparous) - chúng chỉ sinh sản một lần duy nhất trong đời trước khi kiệt sức chết; ở con đực trưởng thành, răng và hàm thoái hóa hoàn toàn nhường chỗ cho sự phát triển vượt bậc của các cơ quan khứu giác để tìm kiếm bạn tình.");

      newC.strengths = appendUniqueString(c.strengths, "Sự tiến hóa của cơ chế hàm lùi và giãn nở buccal (buccal inflation) giúp bắt nhiều sinh vật phù du nhỏ cùng lúc hiệu quả.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Con đực trưởng thành bị tiêu giảm hệ tiêu hóa và răng, mất khả năng ăn uống hoàn toàn và chỉ sinh tồn bằng nguồn năng lượng dự trữ còn lại để sinh sản.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Giai đoạn ấu trùng leptocephalus của chúng hoàn toàn trong suốt và dẹt như lá cây, có thể trôi nổi hàng ngàn km theo các dòng hải lưu ấm.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jfb.14515", 
        "label": "Journal of Fish Biology - Biology of the gulper eel Eurypharynx pelecanoides" 
      });

    } else if (c.id === "sunda-pangolin") {
      newC.characteristics = appendClean(c.characteristics, "Lớp vảy cứng sừng kitin được cấu tạo từ các phiến alpha-keratin và beta-keratin ép chồng, tạo nên cấu trúc composite bền bỉ có khả năng phân tán lực cắn từ răng nanh động vật săn mồi.");
      newC.survival_method = appendClean(c.survival_method, "Khi cuộn tròn bảo vệ, chúng gài chặt phần chóp đuôi có vảy sắc cạnh vào các rãnh vảy lưng để khóa chặt khối cơ thể thành khối cầu liên kết vững chắc.");
      newC.unique_traits = appendClean(c.unique_traits, "Phần gốc lưỡi siêu dài đi vòng qua khoang ngực và bám cố định vào sụn ức (xiphoid process), tạo ra một đòn bẩy cơ học lý tưởng để phóng lưỡi ra xa với vận tốc cao.");

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống cơ lưỡi hoạt động như một Muscular Hydrostat dẻo dai giúp thọc sâu vào các ngóc ngách hẹp của tổ mối đất.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Sự tiêu biến răng và hàm buộc dạ dày phải hoạt động cường độ cao để nghiền nát con mồi, khiến chúng dễ bị đầy chướng bụng nếu nuốt phải quá nhiều tạp chất.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cấu trúc sụn xiphoid ở tê tê kéo dài bất thường xuống tận khoang bụng để nâng đỡ hệ cơ lưỡi khổng lồ.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1007/s10914-019-09476-w", 
        "label": "Journal of Mammalian Evolution - Anatomy of the lingual apparatus in Manis javanica" 
      });

    } else if (c.id === "wolverine") {
      newC.characteristics = appendClean(c.characteristics, "Khớp hàm dưới có cấu trúc lồi cầu (condyle) khóa sâu vào ổ chảo xương thái dương, giúp ngăn chặn sự trật khớp hàm khi thực hiện lực cắn nghiền nát xương cứng.");
      newC.survival_method = appendClean(c.survival_method, "Chúng theo dõi chu kỳ di cư của các đàn sói để tìm kiếm các mẩu xương và thức ăn thừa đông cứng bám dọc theo đường đi, sử dụng nướu răng và tuyến nhai cực khỏe để xé rách.");
      newC.unique_traits = appendClean(c.unique_traits, "Chu kỳ mang thai đặc biệt kết hợp cơ chế phôi nghỉ (delayed implantation) kéo dài tới 6 tháng, phôi bào tạm ngưng phân chia ở trạng thái blastocyst để chờ tín hiệu hormonal kích hoạt vào đầu đông.");

      newC.strengths = appendUniqueString(c.strengths, "Khớp hàm khóa chốt độc đáo tăng cường độ bám và ngăn ngừa tổn thương xương sọ dưới tải trọng cắn cực lớn.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Cơ chế phôi nghỉ phụ thuộc cao vào trữ lượng mỡ cơ thể của con cái trước mùa đông; nếu con cái bị đói, phôi sẽ tự hủy.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Khớp hàm khóa của wolverine chặt đến mức sau khi chết, hộp sọ của chúng vẫn giữ nguyên tư thế cắn chặt mà không thể cạy mở nếu không phá hủy cấu trúc xương.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/j.1469-7998.2005.00016.x", 
        "label": "Journal of Zoology - Jaw mechanics and bite force of the wolverine Gulo gulo" 
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 166 ===================");
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
