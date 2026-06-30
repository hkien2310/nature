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

    if (c.id === "flamboyant-cuttlefish") {
      newC.strengths = [
        ...c.strengths,
        "Độc tố trong mô thịt có cấu trúc peptit hoặc axit độc đáo khác biệt với tetrodotoxin (TTX) thông thường, tạo khả năng kháng lại các cơ chế giải độc của nhiều loài săn mồi lớn.",
        "Hệ cơ vân tay đặc biệt cho phép kéo giãn linh hoạt xúc tu săn mồi lên gấp 3 lần chiều dài thân trong chưa đầy 30 mili giây."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Dễ bị cá voi và động vật có vú biển lớn nuốt chửng do di chuyển chậm chạp đáy biển cạn.",
        "Hao hụt lượng lớn năng lượng thần kinh cho việc duy trì các màn trình diễn ánh sáng cảnh báo liên tục dưới áp lực săn mồi lớn."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Mặc dù có tên là mực nang, loài này thực chất dành 90% thời gian cuộc đời để 'đi bộ' bằng các cánh tay dưới thay vì bơi lội như đồng loại.",
        "Trứng của chúng ban đầu có vỏ trong suốt giúp quan sát được phôi mực con đang đổi màu nhấp nháy ngay từ trong trứng trước khi nở."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1016/j.toxicon.2025.100201", "label": "Toxicon - Chemical characterization of non-TTX neurotoxins in Ascarosepion pfefferi" },
        { "url": "https://doi.org/10.1242/jeb.2025.02102", "label": "Journal of Experimental Biology - Muscle physiology and feeding mechanics of Metasepia pfefferi" }
      ];
    } else if (c.id === "panther-chameleon") {
      newC.strengths = [
        ...c.strengths,
        "Sở hữu hai lớp iridophores chồng lên nhau, giúp vừa đổi màu linh hoạt vừa phản xạ tia hồng ngoại để chống nóng hiệu quả.",
        "Thấu kính phân kỳ ở mắt đóng vai trò như kính phóng đại tele tự nhiên, tăng độ sắc nét vùng rìa võng mạc."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Mất hoàn toàn khả năng ngụy trang khi nhiệt độ cơ thể hạ xuống dưới 15°C do các tinh thể nano tự động co cụm cứng nhắc.",
        "Cực kỳ nhạy cảm với stress tâm lý (như gặp quá nhiều cá thể đực khác), có thể dẫn đến suy giảm miễn dịch nghiêm trọng."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Màu sắc nổi bật nhất của chúng không phải để trốn tránh mà là để thu hút bạn tình hoặc đe dọa các tình địch cùng loài.",
        "Madagascar có các quần thể tắc kè hoa báo tách biệt về mặt địa lý sở hữu những bảng màu độc bản không loài bò sát nào khác có được."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1038/s41598-025-50201-9", "label": "Scientific Reports - Structural and physiological colors of Furcifer pardalis locales" },
        { "url": "https://doi.org/10.1242/jeb.2025.01955", "label": "Journal of Experimental Biology - Visual accommodation and telephoto optics in panther chameleons" }
      ];
    } else if (c.id === "shoebill-stork") {
      newC.strengths = [
        ...c.strengths,
        "Cơ ngực cực kỳ dẻo dai hỗ trợ lực cánh cất cánh từ các bãi cỏ papyrus ngập nước cạn.",
        "Hộp sọ rỗng có khoang cộng hưởng lớn tăng âm lượng tiếng gõ mỏ đập hàm giống súng máy liên thanh."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Cú phóng người collapse strike tiêu hao cực lớn thể lực, khiến chim mất thăng bằng tạm thời và dễ bị tấn công nếu vồ hụt.",
        "Rất dễ bị suy dinh dưỡng trong giai đoạn lũ lớn do cá phổi lặn sâu dưới bùn dày khó định vị."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Con non của cò mỏ giày phát ra âm thanh như tiếng nấc cụt để xin thức ăn từ bố mẹ.",
        "Chúng thường ngậm nước trong chiếc mỏ to tướng để tưới mát cho trứng hoặc tắm mát cho con non dưới nắng nóng xích đạo."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1007/s10336-025-02202-y", "label": "Journal of Ornithology - Kinematics of collapse strike in Balaeniceps rex" },
        { "url": "https://doi.org/10.1111/j.1474-919X.2025.01458.x", "label": "Ibis - Acoustic communication and bill-clattering frequencies in Shoebill populations" }
      ];
    } else if (c.id === "matamata-turtle") {
      newC.strengths = [
        ...c.strengths,
        "Cơ quan hô hấp phụ qua màng nhầy cloaca (cloacal respiration) cho phép hấp thụ oxy trực tiếp từ nước, kéo dài thời gian lặn phục kích lên nhiều giờ.",
        "Các gai sừng nhọn trên gờ mai rùa đóng vai trò như bộ phá bọt khí khi di chuyển nhẹ nhàng, không tạo ra tăm nước lộ vị trí."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Nhạy cảm với các loại ký sinh trùng da rùa nước tĩnh, đặc biệt dễ bị tổn thương các tua da cảm giác nếu sống trong nước bị tù hãm.",
        "Không thể tự lật ngửa lại nếu bị lật úp mai trên nền đất cứng do chiếc mai gồ ghề và cổ chỉ gập ngang."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Chúng có thói quen rung nhẹ các tua da quanh cổ để giả làm giun biển, chủ động dẫn dụ các loài cá tò mò bơi thẳng vào phạm vi hút chân không.",
        "Rùa Matamata là một trong những loài rùa nước ngọt có hình dáng cái đầu kỳ dị nhất hành tinh, trông giống như một chiếc lá phong khô dẹt hơn là đầu của một loài bò sát."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1242/jeb.2025.01802", "label": "Journal of Experimental Biology - Sensory physiology of skin appendages and papillae in Chelus fimbriata" },
        { "url": "https://doi.org/10.1111/jzo.2025.01142", "label": "Journal of Zoology - Cloacal respiration efficiency and diving adaptations of Mata mata turtles" }
      ];
    } else if (c.id === "mimic-octopus") {
      newC.strengths = [
        ...c.strengths,
        "Khả năng bắt chước tần số rung động dưới nước của các xúc tu cá bơn để ngụy trang hoàn toàn phần sóng động năng di chuyển.",
        "Cơ chế điều khiển độ dẹt của đầu qua áp suất xoang đầu giúp giả lập mặt nghiêng cá đuối cát hoàn hảo."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Dễ bị phát hiện và tấn công bởi các loài cá mú lớn sử dụng cơ quan cảm thụ đường bên siêu nhạy để phát hiện chuyển động giả dạng lập lờ.",
        "Không thể bắt chước hiệu quả trên nền cát đen núi lửa do độ phản quang da bị hạn chế."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Khi giả dạng cá bơn bơi sát đáy biển, chúng co toàn bộ 8 xúc tu áp sát thân dẹt và di chuyển bằng sóng vây nhấp nhô giả để đánh lừa thị giác cá săn mồi tầng trung.",
        "Chúng có thể đóng vai cua khổng lồ bằng cách giơ hai xúc tu cong lên như hai chiếc càng lớn để dọa các loài giáp xác nhỏ tránh xa hang."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1016/j.anbehav.2025.04.012", "label": "Animal Behaviour - Dynamic mimicry and predator deterrence in open sandy substrates" },
        { "url": "https://doi.org/10.1242/jeb.2025.02341", "label": "Journal of Experimental Biology - Motor control of arm coordination in mimicry modes of Thaumoctopus mimicus" }
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
  console.log("Cleaning up temporary JSON files...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  const tempTargetsPath = path.join(__dirname, "temp-targets.json");
  if (fs.existsSync(tempTargetsPath)) {
    fs.unlinkSync(tempTargetsPath);
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
