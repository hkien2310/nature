const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
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

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your_supabase") || supabaseAnonKey.includes("your_supabase")) {
  console.warn("Supabase credentials not configured in .env.local yet. Skipping seeding.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const creaturesData = [
  {
    id: "bullet-ant",
    name: "Kiến Đạn",
    scientific_name: "Paraponera clavata",
    class: "Insecta",
    order: "Hymenoptera",
    family: "Paraponerinae",
    real_weight: "~0.1g",
    size: "18–30 mm",
    characteristics: "Thân màu đen hoặc đỏ sẫm, kiến thợ có hàm nhai (mandibles) lớn, ngòi châm dài chứa nọc độc poneratoxin.",
    habitat: "Rừng nhiệt đới Trung và Nam Mỹ",
    location: "Rừng mưa nhiệt đới từ Nicaragua đến Paraguay.",
    survival_method: "Sống bầy đàn trong tổ dưới gốc cây, ăn mật hoa và côn trùng nhỏ, tự vệ bằng nọc đốt đau đớn để xua đuổi thú săn mồi lớn.",
    unique_traits: "Sở hữu cú đốt độc lập đạt cấp độ cao nhất trong thang Schmidt, khả năng kêu 'rè rè' khi bị đe dọa.",
    short_description: "Vết đốt đau nhất trong thế giới côn trùng. Đau 24 giờ không ngừng.",
    description:
      "Kiến Đạn là một trong những sinh vật đáng sợ nhất nếu xét theo tỉ lệ kích thước. Vết đốt của nó được đánh giá cấp 4+ trên thang Schmidt — cấp cao nhất, vượt qua ong bắp cày và tất cả các loài côn trùng khác. Nếu quy về cùng cân nặng với con người, lực đốt và sức kéo của nó thuộc hàng thượng đỉnh trong tự nhiên.",
    strengths: [
      "Nọc độc Poneratoxin gây đau cực mạnh, tê liệt thần kinh",
      "Sức kéo gấp 30 lần trọng lượng cơ thể",
      "Hàm mandible cực mạnh, khóa chặt không nhả",
      "Phản ứng hóa học — phối hợp đàn theo pheromone tức thời",
    ],
    weaknesses: [
      "Kích thước thật sự quá nhỏ — dễ bị đè bẹp",
      "Chỉ hoạt động hiệu quả theo đàn",
      "Chậm hơn nhiều loài côn trùng khác",
    ],
    fun_facts: [
      "Thổ dân Sateré-Mawé dùng kiến đạn trong nghi lễ trưởng thành — đeo găng tay nhồi 80 con kiến trong 10 phút",
      "Vết đốt gây đau liên tục 12–24 giờ, cảm giác như trúng đạn",
      "Mỗi con có thể đốt nhiều lần — không như ong chết sau khi đốt",
    ],
    sources: [
      { label: "Schmidt Pain Index", url: "https://doi.org/10.1016/0041-0101(90)90096-4" },
      { label: "Poneratoxin research", url: "https://pubmed.ncbi.nlm.nih.gov/15936249/" },
    ],
    image_color: "#8B1A1A",
    diet_type: "omnivore",
    diet_items: ["mật hoa", "côn trùng nhỏ", "nhựa cây"],
    activity_pattern: "diurnal",
    lifespan_min: 3,
    lifespan_max: 5,
    lifespan_unit: "months",
    reproduction_type: "sexual",
    reproduction_notes: "Sinh sản lưỡng tính thụ tinh qua kiến chúa, kiến thợ là kiến cái bất thụ.",
    locomotion: "walk",
    speed_max: 0.1,
    conservation_status: "LC",
    size_min_mm: 18,
    size_max_mm: 30,
    weight_avg_g: 0.05
  },
  {
    id: "mantis-shrimp",
    name: "Tôm Bọ Ngựa",
    scientific_name: "Odontodactylus scyllarus",
    class: "Malacostraca",
    order: "Stomatopoda",
    family: "Odontodactylidae",
    real_weight: "~100g",
    size: "18–30 cm (có thể đạt 38cm)",
    characteristics: "Vỏ ngoài sặc sỡ đa sắc, có cặp càng búa dập cực mạnh hoạt động như lò xo nén.",
    habitat: "Vùng biển nhiệt đới Ấn Độ Dương và Thái Bình Dương",
    location: "Vùng biển nhiệt đới Indo-Pacific từ Đông Phi đến Hawaii.",
    survival_method: "Đào hang sâu dưới đáy cát/san hô, săn mồi đơn độc bằng cách rình rập và tung đòn đập vỡ lớp vỏ cứng của cua, ốc.",
    unique_traits: "Cú đấm siêu thanh tạo bong bóng cavitation nhiệt độ mặt trời, thị giác phức tạp nhất thế giới động vật với 16 thụ thể màu sắc.",
    short_description: "Đấm nhanh hơn viên đạn. Tạo ra plasma khi tấn công.",
    description:
      "Tôm Bọ Ngựa sở hữu cú đấm mạnh nhất tính theo tỉ lệ cơ thể trong tự nhiên. Tốc độ đánh đạt 23 m/s — nhanh hơn viên đạn súng ngắn. Va chạm tạo ra cavitation bubble đạt nhiệt độ bề mặt mặt trời (~5500°C thoáng qua) và sóng xung kích. Mắt của nó nhìn thấy 16 loại màu trong khi con người chỉ thấy 3.",
    strengths: [
      "Cú đấm nhanh nhất trong tự nhiên: 23 m/s, lực 1500 Newton",
      "Tạo cavitation plasma ~5500°C khi tấn công",
      "Giáp exoskeleton đặc biệt — chịu được va đập cực lớn",
      "Thị lực 16 kênh màu — nhìn thấy tia UV, hồng ngoại",
    ],
    weaknesses: [
      "Môi trường sống giới hạn trong nước",
      "Kích thước cơ thể nhỏ thật sự (~30cm)",
      "Hung hăng quá mức — tự gây thương tích trong bể nuôi",
    ],
    fun_facts: [
      "Các nhà nghiên cứu Harvard đang nghiên cứu cấu trúc càng của nó để chế tạo giáp xe tăng",
      "Có thể đập vỡ kính bể cá — người nuôi phải dùng kính cường lực đặc biệt",
      "Mỗi cú đấm tương đương bắn một viên đạn 0.22 caliber",
    ],
    sources: [
      { label: "Patek et al. - Strike mechanics", url: "https://doi.org/10.1098/rspb.2004.2840" },
      { label: "Nature - Mantis shrimp club", url: "https://doi.org/10.1038/nature10092" },
    ],
    image_color: "#1A4A6B",
    diet_type: "carnivore",
    diet_items: ["cua đá", "ốc biển", "cá nhỏ", "giáp xác"],
    activity_pattern: "diurnal",
    lifespan_min: 3,
    lifespan_max: 7,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Thụ tinh ngoài, một số loài chung thủy một vợ một chồng suốt đời.",
    locomotion: "hybrid",
    speed_max: 10.0,
    conservation_status: "LC",
    size_min_mm: 180,
    size_max_mm: 380,
    weight_avg_g: 120.0
  },
  {
    id: "blue-ringed-octopus",
    name: "Bạch Tuộc Đốm Xanh",
    scientific_name: "Hapalochlaena lunulata",
    class: "Cephalopoda",
    order: "Octopoda",
    family: "Octopodidae",
    real_weight: "~30g",
    size: "12–20 cm",
    characteristics: "Màu da vàng nhạt với các đốm xanh dương phát sáng nhảy múa khi bị đe dọa, thân mềm không xương.",
    habitat: "Vùng biển San hô Thái Bình Dương và Ấn Độ Dương",
    location: "Các rạn san hô và hồ triều ở Thái Bình Dương và Ấn Độ Dương.",
    survival_method: "Săn cua, tôm đêm bằng cách phun nước chứa nọc Tetrodotoxin làm tê liệt con mồi từ xa hoặc cắn trực tiếp.",
    unique_traits: "Nọc độc cộng sinh cực mạnh không có thuốc giải, có thể đổi màu ngụy trang hòa mình vào san hô chỉ trong tích tắc.",
    short_description: "Đủ nọc để giết 26 người trưởng thành. Không có thuốc giải.",
    description:
      "Bạch Tuộc Đốm Xanh là một trong những sinh vật độc nhất trên Trái Đất. Nọc Tetrodotoxin (TTX) của nó mạnh hơn cyanide 1200 lần. Không màu, không mùi, không đau khi bị cắn — nạn nhân chỉ biết mình bị nhiễm khi đã tê liệt. Không có thuốc giải. Cách duy nhất sống sót là hô hấp nhân tạo trong nhiều giờ.",
    strengths: [
      "TTX mạnh hơn cyanide 1200 lần, không có thuốc giải",
      "Đủ nọc giết 26 người — từ 1 con 30 gram",
      "Ngụy trang hoàn hảo, khó phát hiện cho đến khi quá muộn",
      "Đốm xanh phát sáng là cảnh báo — nhưng nhiều người không biết",
    ],
    weaknesses: [
      "Cực kỳ yếu về thể chất — không có sức mạnh cơ bắp",
      "Chỉ gây chết trong nước hoặc tiếp xúc trực tiếp",
      "Vũ khí chủ yếu là phòng thủ, không phải tấn công chủ động",
    ],
    fun_facts: [
      "Đốm xanh iridescent không phải màu thật — là cấu trúc quang học như cánh bướm",
      "Tetrodotoxin không do bạch tuộc tổng hợp — từ vi khuẩn cộng sinh trong cơ thể nó",
      "Nọc đủ giết người trong 30 phút nhưng không có triệu chứng đau",
    ],
    sources: [
      { label: "TTX toxicology", url: "https://pubmed.ncbi.nlm.nih.gov/23206318/" },
      { label: "Blue-ringed octopus venom", url: "https://doi.org/10.1016/j.toxicon.2011.01.005" },
    ],
    image_color: "#0A3D5C",
    diet_type: "carnivore",
    diet_items: ["cua nhỏ", "tôm biển", "cá nhỏ"],
    activity_pattern: "nocturnal",
    lifespan_min: 1,
    lifespan_max: 2,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Giao phối hữu tính, cả con đực và con cái đều chết ngay sau chu kỳ sinh sản.",
    locomotion: "hybrid",
    speed_max: 5.0,
    conservation_status: "LC",
    size_min_mm: 120,
    size_max_mm: 200,
    weight_avg_g: 30.0
  },
  {
    id: "goliath-beetle",
    name: "Bọ Hung Goliath",
    scientific_name: "Goliathus goliatus",
    class: "Insecta",
    order: "Coleoptera",
    family: "Scarabaeidae",
    real_weight: "~100g",
    size: "60–110 mm (con đực)",
    characteristics: "Cơ thể to lớn cứng cáp với hoa văn đen trắng đặc trưng trên ngực, con đực có sừng chữ Y lớn.",
    habitat: "Rừng nhiệt đới Trung Phi",
    location: "Rừng nhiệt đới xích đạo châu Phi.",
    survival_method: "Ăn nhựa cây và trái cây chín, sử dụng lớp giáp exoskeleton siêu dày để chống chọi kẻ thù, dùng sừng làm đòn bẩy hất văng đối thủ.",
    unique_traits: "Là một trong những loài côn trùng nặng nhất thế giới, sức nâng cơ học phi thường so với trọng lượng.",
    short_description: "Côn trùng nặng nhất thế giới. Bay được dù nặng như quả táo.",
    description:
      "Bọ Hung Goliath là côn trùng nặng nhất thế giới — con đực trưởng thành có thể đạt 100g và dài 11cm. Điều đáng kinh ngạc là nó vẫn bay được dù có ngoại cốt bộ dày và nặng nề. Sừng trên đầu dùng để cắm vào kẻ địch và lật ngược — đây là vũ khí chứ không phải trang trí.",
    strengths: [
      "Sức kéo gấp 850 lần trọng lượng cơ thể — mạnh nhất trong côn trùng",
      "Giáp exoskeleton cực dày, chịu được áp lực lớn",
      "Sừng như cái xẻng — lật và cắm xuyên kẻ địch",
      "Bay được — cơ động bất ngờ với kích thước đó",
    ],
    weaknesses: [
      "Không có nọc độc hay vũ khí hóa học",
      "Tốc độ chậm, phản ứng kém",
      "Dễ bị lật ngược — không tự dậy được",
    ],
    fun_facts: [
      "Sức kéo tương đương một người đàn ông kéo xe tải 65 tấn",
      "Ấu trùng mất 1-2 năm để phát triển, ăn gỗ mục",
      "Thường được nuôi ở Nhật như thú cưng — giá vài triệu đồng/con",
    ],
    sources: [
      { label: "Insect strength research", url: "https://doi.org/10.1242/jeb.02455" },
      { label: "Goliath beetle biology", url: "https://www.britannica.com/animal/Goliath-beetle" },
    ],
    image_color: "#2D4A1E",
    diet_type: "herbivore",
    diet_items: ["nhựa cây", "trái cây chín"],
    activity_pattern: "diurnal",
    lifespan_min: 6,
    lifespan_max: 12,
    lifespan_unit: "months",
    reproduction_type: "sexual",
    reproduction_notes: "Vòng đời biến thái hoàn toàn thông qua giai đoạn ấu trùng ăn gỗ mục dưới lòng đất.",
    locomotion: "hybrid",
    speed_max: 1.5,
    conservation_status: "LC",
    size_min_mm: 60,
    size_max_mm: 110,
    weight_avg_g: 80.0
  },
  {
    id: "emperor-scorpion",
    name: "Bọ Cạp Hoàng Đế",
    scientific_name: "Pandinus imperator",
    class: "Arachnida",
    order: "Scorpiones",
    family: "Scorpionidae",
    real_weight: "~30g",
    size: "20–23 cm",
    characteristics: "Thân đen bóng loáng, cặp càng kẹp to khỏe xù xì, đuôi có ngòi độc nhưng nọc yếu.",
    habitat: "Rừng nhiệt đới và thảo nguyên Tây Phi",
    location: "Rừng nhiệt đới và thảo nguyên ẩm Tây Phi.",
    survival_method: "Sống trong hang tự đào hoặc dưới vỏ cây mục, kẹp nát con mồi bằng đôi càng khổng lồ thay vì chích nọc.",
    unique_traits: "Phát huỳnh quang màu xanh lục neon rực rỡ dưới ánh sáng tia cực tím (UV).",
    short_description: "Bọ cạp lớn nhất thế giới. Trông đáng sợ nhưng nọc nhẹ hơn ong.",
    description:
      "Bọ Cạp Hoàng Đế là loài bọ cạp lớn nhất thế giới — dài tới 23cm, nặng 30g. Nghịch lý ở chỗ: nhìn cực kỳ đáng sợ nhưng nọc độc lại yếu hơn ong. Chiến lược của nó là dùng kích thước và càng khổng lồ để ép chết con mồi — không dùng đuôi. Đây là ví dụ điển hình của intimidation over lethality.",
    strengths: [
      "Càng chelae cực mạnh — kẹp và ép chết con mồi",
      "Giáp exoskeleton cứng, phản chiếu UV",
      "Khả năng cảm nhận rung động đất — phát hiện mọi chuyển động",
      "Nocturnal hunter — săn đêm hiệu quả",
    ],
    weaknesses: [
      "Nọc yếu — chỉ nguy hiểm với người dị ứng",
      "Chậm chạp so với kích thước",
      "Dễ mất nước trong môi trường khô",
    ],
    fun_facts: [
      "Phát huỳnh quang xanh lam dưới ánh đèn UV — nguyên nhân vẫn chưa rõ",
      "Mặc dù nọc yếu, chúng vẫn là loài bọ cạp phổ biến nhất trong ngành nuôi thú cưng kỳ lạ",
      "Con cái mang con trên lưng cho đến khi lột xác lần đầu",
    ],
    sources: [
      { label: "Scorpion venom comparison", url: "https://pubmed.ncbi.nlm.nih.gov/19913031/" },
      { label: "Pandinus imperator biology", url: "https://doi.org/10.1016/j.toxicon.2015.06.017" },
    ],
    image_color: "#1A1A3E",
    diet_type: "carnivore",
    diet_items: ["dế", "mối", "côn trùng nhỏ", "chuột nhắt"],
    activity_pattern: "nocturnal",
    lifespan_min: 5,
    lifespan_max: 8,
    lifespan_unit: "years",
    reproduction_type: "viviparous",
    reproduction_notes: "Sinh con trực tiếp (viviparous), mang con con trên lưng bảo vệ đến khi lột xác lần đầu.",
    locomotion: "walk",
    speed_max: 2.0,
    conservation_status: "LC",
    size_min_mm: 200,
    size_max_mm: 230,
    weight_avg_g: 30.0
  },
];

const sampleVotes = [
  { creature_id: "bullet-ant", strength: 95, durability: 65, speed: 70, weaponry: 99, special: 80, lethality: 88 },
  { creature_id: "mantis-shrimp", strength: 85, durability: 80, speed: 98, weaponry: 97, special: 95, lethality: 90 },
  { creature_id: "blue-ringed-octopus", strength: 20, durability: 30, speed: 60, weaponry: 100, special: 98, lethality: 99 },
  { creature_id: "goliath-beetle", strength: 90, durability: 88, speed: 55, weaponry: 78, special: 40, lethality: 45 },
  { creature_id: "emperor-scorpion", strength: 75, durability: 70, speed: 50, weaponry: 65, special: 55, lethality: 40 }
];

async function run() {
  console.log("Seeding creatures into Supabase...");
  const { data: cData, error: cErr } = await supabase
    .from("creatures")
    .upsert(creaturesData, { onConflict: "id" });

  if (cErr) {
    console.error("Error upserting creatures:", cErr);
    process.exit(1);
  }
  console.log("Creatures seeded successfully!");

  console.log("Seeding admin account...");
  const { error: aErr } = await supabase
    .from("accounts")
    .upsert({
      username: "admin",
      password: "admin123",
      role: "admin"
    }, { onConflict: "username" });

  if (aErr) {
    console.warn("Error upserting admin account:", aErr.message);
  } else {
    console.log("Admin account seeded successfully!");
  }

  console.log("Seeding sample votes...");
  
  // Truncate votes first or ignore errors if they exist
  // We can just try to insert, or truncate first
  const { error: delErr } = await supabase.from("votes").delete().neq("creature_id", "none");
  if (delErr) {
    console.warn("Could not clean old votes, skipping cleanup:", delErr.message);
  }

  const { error: vErr } = await supabase
    .from("votes")
    .insert(sampleVotes);

  if (vErr) {
    console.error("Error inserting sample votes:", vErr);
    process.exit(1);
  }
  console.log("Sample votes seeded successfully!");
  console.log("Seeding complete!");
}

run();
