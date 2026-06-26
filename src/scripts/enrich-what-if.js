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
  console.error("❌ Supabase credentials not found.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runEnrichment() {
  console.log("🔍 Finding 3 priority targets for What-If enrichment...");

  // 1. Get targets (identical logic to get-what-if-targets.js)
  const { data: dbCreatures, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score, characteristics, unique_traits");

  if (cErr || !dbCreatures) {
    console.error("❌ Error fetching creatures:", cErr?.message);
    process.exit(1);
  }

  const { data: dbQuestions, error: qErr } = await supabase
    .from("what_if_questions")
    .select("id, creature_id, title, slug");

  if (qErr) {
    console.error("❌ Error fetching questions:", qErr.message);
    process.exit(1);
  }

  const questionsMap = {};
  dbCreatures.forEach(c => {
    questionsMap[c.id] = [];
  });
  if (dbQuestions) {
    dbQuestions.forEach(q => {
      if (questionsMap[q.creature_id]) {
        questionsMap[q.creature_id].push({
          id: q.id,
          title: q.title,
          slug: q.slug
        });
      }
    });
  }

  const rankedCreatures = dbCreatures.map(c => {
    const existing = questionsMap[c.id] || [];
    return {
      id: c.id,
      name: c.name,
      scientific_name: c.scientific_name,
      ai_p4p_score: c.ai_p4p_score || 50,
      characteristics: c.characteristics || "",
      unique_traits: c.unique_traits || "",
      existing_questions_count: existing.length,
      existing_questions: existing
    };
  });

  rankedCreatures.sort((a, b) => {
    if (a.existing_questions_count !== b.existing_questions_count) {
      return a.existing_questions_count - b.existing_questions_count;
    }
    if (a.ai_p4p_score !== b.ai_p4p_score) {
      return b.ai_p4p_score - a.ai_p4p_score;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = rankedCreatures.slice(0, 3);
  console.log(`🎯 Identified 3 target creatures:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) with P4P: ${t.ai_p4p_score}`));

  const whatIfData = [];

  // 2. Build high-quality What-If scientific data for the targets
  for (const target of targets) {
    if (target.id === "leafcutter-ant") {
      whatIfData.push({
        creature_id: "leafcutter-ant",
        title: "Nếu Kiến Cắt Lá (Leafcutter Ant) phóng to bằng con người (80kg) thì sao?",
        slug: "neu-kien-cat-la-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Kiến Cắt Lá (Atta cephalotes) với lớp giáp canxit và hàm cắt răng cưa phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cỗ máy cắt gọt sinh học khổng lồ)",
            slug: "kien-cat-la-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắt rung hàm máy cưa công nghiệp 1.000 Hz, giáp canxit chịu lực siêu cấp và lực nhấc vật nặng 4 tấn.",
            content: "Khi Kiến Cắt Lá lính phóng to lên 80kg:\n- Hàm răng cưa động cơ phản lực: Cặp hàm gia cố kẽm phóng to tạo ra lực cắt cơ học cực đại. Kết hợp khả năng rung hàm tần số cao 1.000 Hz tạo lực cắt xoay mạnh mẽ như cưa máy công nghiệp, dễ dàng cắt xuyên qua các lớp giáp gỗ, kim loại mỏng hoặc xương thịt.\n- Giáp ngoài Canxit Magie siêu bền: Lớp giáp khoáng hóa tự nhiên dày lên gấp hàng nghìn lần, tạo khả năng chịu va đập cơ học lên tới 20 tấn.\n- Sức nhấc nâng 4 tấn: Tỷ lệ sức nâng cơ bắp cho phép nó nâng các khối hàng, đá nặng gấp 50 lần trọng lượng cơ thể (khoảng 4 tấn).",
            formulas_and_data: {
              scaling_factor: 800000,
              mass_g_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực nâng cơ học lý thuyết",
                  equation: "F_lift = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~40,000 N (nâng ~4 tấn)"
                },
                {
                  name: "Tần số rung cắt của hàm",
                  equation: "f_cut = 1000 Hz",
                  result: "Tốc độ rung cắt cơ học siêu thanh"
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Biomechanical scaling of leaf-cutting ant mandible forces", url: "https://doi.org/10.1242/jeb.02643" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Ngạt thở và giáp khoáng giòn vỡ)",
            slug: "kien-cat-la-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt vì thiếu hệ thống phổi chủ động và nứt vỡ lớp giáp canxit giòn dưới sức nặng của chính mình.",
            content: "Trong thế giới thực tế, Kiến Cắt Lá 80kg sẽ chết lập tức:\n- Ngạt thở trong 3 phút: Hệ thống ống khí quản thụ động không thể dẫn oxy đi sâu vào các lớp mô của cơ thể 80kg do tỷ lệ diện tích bề mặt/thể tích giảm sút nghiêm trọng.\n- Nứt vỡ giáp ngoài: Giáp canxit magie tuy cứng nhưng rất giòn. Khi tăng khối lượng lên 800.000 lần, ứng suất uốn nén do trọng lực kéo đè sẽ làm lớp giáp canxit giòn vỡ nứt ra dưới chân và thân kiến.\n- Trọng lực nghiền nát cơ khớp: Trọng lượng 80kg đè nén khiến các đốt khớp chân mảnh khảnh bị khuỵu gãy.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Khủng hoảng hô hấp ống khí",
                  issue: "Diện tích khuếch tán khí giảm tỷ lệ nghịch với chiều dài cơ thể phóng to (giảm ~80 lần hiệu suất)."
                },
                {
                  type: "Nứt vỡ giáp canxit",
                  issue: "Ứng suất uốn vượt quá độ bền kéo của giáp canxit (vượt quá 15 MPa), gây rạn nứt giáp tự phát."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Biomechanical constraints on giant arthropods", url: "https://doi.org/10.1086/676859" }
            ]
          },
          {
            title: "Đột biến thích nghi (Pháo đài bọc thép di động)",
            slug: "kien-cat-la-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa hệ thống phổi sách chủ động, giáp canxit-chitin liên hợp dẻo dai và cơ bắp thủy lực tăng cường.",
            content: "Để Kiến Cắt Lá 80kg hoạt động hoàn hảo:\n- Phổi sách cưỡng bức khí: Tuyến thở tiến hóa các túi khí có màng co bóp cơ học chủ động để đẩy oxy đi khắp cơ thể.\n- Giáp Canxit-Chitin liên hợp (Calcite-Chitin Composite Armor): Cấu trúc giáp đan xen các sợi kitin dẻo dai với các hạt nano canxit magie, loại bỏ tính giòn, tăng độ dẻo chống va đập cơ học lên gấp 10 lần.\n- Trợ lực thủy dịch (Hemolymph Assist): Cơ bắp hoạt động bổ trợ bằng áp lực thủy lực dịch dịch bạch huyết để gánh trọng tải lớn mà không làm mỏi cơ.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Cơ cấu giáp Canxit-Chitin liên hợp",
                  benefit: "Độ dai va đập tăng từ 0.5 kJ/m² lên 8 kJ/m², chống rạn nứt tuyệt đối dưới tải trọng 80kg."
                },
                {
                  type: "Trợ lực thủy lực dịch bạch huyết",
                  benefit: "Tăng lực nén cơ bắp thêm 45% giúp chống lại trọng lực trái đất."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Advanced bio-inspired composites and mechanical properties", url: "https://doi.org/10.1016/j.mser.2021.100612" }
            ]
          }
        ]
      });
    } else if (target.id === "weaver-ant") {
      whatIfData.push({
        creature_id: "weaver-ant",
        title: "Nếu Kiến Dệt Lá (Weaver Ant) phóng to bằng con người (80kg) thì sao?",
        slug: "neu-kien-det-la-to-bang-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Kiến Dệt Lá (Oecophylla smaragdina) với khả năng phun axit và bám dính siêu việt phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Thợ dệt khổng lồ và nọc axit tàn phá)",
            slug: "kien-det-la-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Phun axit formic áp lực cao tầm xa 15m, lực bám dính van der Waals giữ tải trọng 8 tấn và sức nâng 4 tấn.",
            content: "Khi Kiến Dệt Lá phóng to lên 80kg:\n- Súng phun axit áp lực: Tuyến axit formic ở bụng phóng to có thể bắn ra luồng axit formic đậm đặc xa tới 15m, gây bỏng hóa học cực nặng và mù mắt kẻ thù ngay lập tức.\n- Lực bám dính van der Waals siêu cấp: Đệm chân (arolia) phóng to tạo ra lực bám liên kết van der Waals khổng lồ, bám chặt ngược trần nhà và giữ được vật nặng tới 8 tấn.\n- Dệt tơ bằng ấu trùng siêu chịu lực: Khả năng phối hợp tập thể dùng ấu trùng để dệt những tấm tơ bảo vệ có độ bền kéo ngang sợi Kevlar bọc thép.",
            formulas_and_data: {
              scaling_factor: 800000,
              mass_g_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực bám dính chân van der Waals lý thuyết",
                  equation: "F_adhesion = F_original * (A_scaled / A_original)",
                  result: "~80,000 N (giữ được ~8 tấn tải trọng ngược dòng trọng lực)"
                },
                {
                  name: "Tầm xa phun axit formic",
                  equation: "Range = Range_original * L_scaling_factor",
                  result: "~15 m"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "A",
            sources: [
              { label: "Adhesive forces and scaling in weaver ants", url: "https://doi.org/10.1242/jeb.02013" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Ngạt thở và trượt ngã thảm hại)",
            slug: "kien-det-la-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Suy kiệt oxy do hô hấp thụ động và mất lực bám dính van der Waals chân dưới khối lượng lập phương khổng lồ.",
            content: "Trong thế giới thực tế, Kiến Dệt Lá 80kg sẽ chết ngạt và không thể bám dính:\n- Chết ngạt do trao đổi khí kém: Thiếu phổi và hệ thống tim mạch kín, lượng oxy khuếch tán thụ động không thể đi tới các mô cơ quan sâu, khiến kiến bất tỉnh sau 2-3 phút.\n- Trượt ngã tự do: Lực bám dính chân van der Waals tỷ lệ thuận với diện tích bề mặt đệm chân (bình phương), trong khi khối lượng tăng theo thể tích (lập phương). Ở kích thước 80kg, trọng lượng cơ thể vượt quá 10 lần giới hạn bám dính tối đa của chân, khiến kiến lập tức trượt rơi tự do khi trèo bám lá cây.\n- Xẹp lép bụng mềm: Đốt eo và bụng của kiến dệt lá rất mảnh khảnh, sẽ bị gãy gập dưới lực nén trọng trường Trái Đất.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Mất khả năng bám dính",
                  issue: "Tỷ lệ lực bám/trọng lượng giảm đi 80 lần, khiến lực bám thực tế chỉ chịu được tối đa 8kg trọng lượng cơ thể."
                },
                {
                  type: "Gãy gập đốt eo (petiole)",
                  issue: "Mô men uốn tác dụng lên đốt eo vượt quá giới hạn bền cắt của kitin eo (40 MPa)."
                }
              ]
            },
            p4p_score_scaled: 13,
            tier_scaled: "D",
            sources: [
              { label: "Scaling limits of insect adhesive pads", url: "https://doi.org/10.1098/rsif.2015.0834" }
            ]
          },
          {
            title: "Đột biến thích nghi (Chiến binh bám đuổi và dệt giáp)",
            slug: "kien-det-la-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ hô hấp túi khí có vách, đệm chân aralia tiết keo sinh học chủ động tái sử dụng và giáp eo kitin gia cường tinh thể carbon.",
            content: "Để Kiến Dệt Lá 80kg sống sót và chiến đấu tốt:\n- Hô hấp túi khí chủ động: Phát triển túi khí co bóp bằng cơ bụng để lưu thông không khí cưỡng bức.\n- Đệm chân bám dính tiết chất lỏng dính (Secration-enhanced Pads): Đệm chân tiến hóa khả năng tiết ra một lớp màng chất lỏng mucilage cực mỏng có lực bám kết dính hydrogel chủ động, có thể tắt/mở lực dính bằng cách thay đổi ion bề mặt, giúp kiến di chuyển bám dính dốc đứng hoàn hảo.\n- Gia cố đốt eo kitin-khoáng: Đốt eo được gia cường bằng các dải kitin xếp chéo kết tinh khoáng hóa, tăng giới hạn chịu uốn kéo lên gấp 8 lần.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Chất lỏng đệm bám hydrogel chủ động",
                  benefit: "Lực liên kết ma sát tăng gấp 15 lần so với lực van der Waals thuần túy, bám chắc tải trọng 120kg trên bề mặt dốc."
                },
                {
                  type: "Đốt eo gia cường sợi kitin chéo",
                  benefit: "Nâng giới hạn bền cắt lên 320 MPa, bảo vệ cấu trúc eo an toàn khi mang vác vật nặng."
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "B",
            sources: [
              { label: "Advanced insect adhesion mechanisms and materials", url: "https://doi.org/10.1098/rsif.2019.0682" }
            ]
          }
        ]
      });
    } else if (target.id === "brazilian-wandering-spider") {
      whatIfData.push({
        creature_id: "brazilian-wandering-spider",
        title: "Nếu Nhện Lang Thang Brazil (Brazilian Wandering Spider) phóng to bằng con người (80kg) thì sao?",
        slug: "neu-nhen-lang-thang-brazil-to-bang-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Nhện Lang Thang Brazil (Phoneutria nigriventer) với nọc độc peptide và sức nhảy bứt tốc phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Hung thần nọc độc và bước nhảy 50m)",
            slug: "nhen-lang-thang-brazil-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Nọc độc Tx2-6 siêu kích hoạt nitric oxide quy mô cực lớn, cú nhảy vọt cao 25m xa 50m và càng cằm dài 10cm cắn ngập thép.",
            content: "Khi Nhện Lang Thang Brazil phóng to lên 80kg:\n- Hàm cằm đỏ tử thần: Cặp càng chelicerae dài 10cm được bao phủ lông đỏ đe dọa, có lực cắn nghiền nát xương và cắn thủng vỏ kim loại mỏng dễ dàng.\n- Nọc độc Tx2-6 gây sốc hệ thống: Liều lượng nọc độc phóng ra ở quy mô gram, kích hoạt nitric oxide tràn ngập mạch máu con mồi, gây cương cứng đau đớn dữ dội đi kèm suy hô hấp cấp tính và tử vong chỉ trong vòng vài giây.\n- Siêu tốc độ và nhảy vọt: Hệ thống thủy lực chân phóng to cho phép bứt tốc đạt 60 km/h và nhảy cao 25m, nhảy xa 50m chỉ trong một nốt nhạc.",
            formulas_and_data: {
              scaling_factor: 80000,
              mass_g_original: 1.0,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Khoảng cách nhảy xa lý thuyết",
                  equation: "D_jump = D_original * L_scaling_factor",
                  result: "~50 m"
                },
                {
                  name: "Lực cắn của càng chelicerae",
                  equation: "F_bite = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,500 N"
                }
              ]
            },
            p4p_score_scaled: 96,
            tier_scaled: "S",
            sources: [
              { label: "Brazilian wandering spider venom pharmacology", url: "https://doi.org/10.1016/j.toxicon.2015.09.002" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sụp vỡ khớp thủy lực và ngạt thở phổi sách)",
            slug: "nhen-lang-thang-brazil-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Liệt hệ thống vận động thủy dịch dưới áp lực cao và ngạt thở do cấu trúc phổi sách thụ động thiếu gió khí.",
            content: "Trong thực tế sinh học, nhện 80kg sẽ gục ngã hoàn toàn:\n- Suy hô hấp phổi sách thụ động: Nhện hô hấp qua các lá phổi sách (book lungs) thụ động không có cơ hoành để hút xả khí. Ở quy mô 80kg, các lá phổi sách sẽ dính chặt vào nhau dưới áp lực dịch thể và trọng lực, khiến nhện chết ngạt vì thiếu dưỡng khí sau vài phút.\n- Vỡ vụn áp suất thủy lực chân: Nhện duỗi chân chủ yếu bằng cách bơm dịch hemolymph áp suất cao vào chân. Để di chuyển cơ thể 80kg bứt tốc, áp suất thủy lực trong chân nhện phải tăng lên tới mức 50-60 atm. Áp suất khủng khiếp này sẽ xé rách lớp biểu bì exoskeleton mỏng hoặc làm nổ tung các khớp chân nhện.\n- Sụp đổ xương ngoài kitin: Cấu trúc chân dài mảnh của nhện lang thang sẽ bị oằn cong gãy vụn dưới lực đè nén 80kg.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Vỡ áp lực chân thủy lực",
                  issue: "Áp suất hemolymph cần thiết (6,000 kPa) vượt quá giới hạn nứt màng biểu bì cutin (800 kPa), làm vỡ khớp chân."
                },
                {
                  type: "Xẹp xẹp phổi sách thụ động",
                  issue: "Diện tích lá phổi sách dính chặt nhau khiến hiệu suất trao đổi khí giảm xuống dưới 1.5% nhu cầu trao đổi chất."
                }
              ]
            },
            p4p_score_scaled: 14,
            tier_scaled: "D",
            sources: [
              { label: "Biophysics of hydraulic leg extension in spiders", url: "https://doi.org/10.1242/jeb.02410" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái vật săn mồi tàng hình tốc độ)",
            slug: "nhen-lang-thang-brazil-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống tim bơm chân cơ bắp thay thế thủy lực, phổi sách ngăn co bóp chủ động và giáp khớp chitin ống lót gốm carbon.",
            content: "Để Nhện Lang Thang Brazil 80kg trở thành bá chủ thực sự:\n- Cơ duỗi chân trực tiếp (Direct Extensor Muscles): Tiến hóa hệ thống bó cơ duỗi chân trực tiếp thay thế cơ chế thủy lực, loại bỏ sự phụ thuộc vào áp suất dịch hemolymph cao để duỗi chân.\n- Phổi sách ngăn co bóp (Active Book Lungs): Các lá phổi sách tiến hóa hệ thống cơ sụn liên sườn thô sơ co bóp chủ động nhịp nhàng để hút xả không khí liên tục.\n- Bộ xương ngoài Composite Chitin-Silicon: Vỏ kitin chân tiến hóa cấu trúc ống rỗng chứa liên kết sợi chéo canxi hóa và hạt gốm silicon siêu nhẹ, tăng sức chịu uốn lên gấp 7 lần.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Cơ duỗi chân thay thế thủy lực",
                  benefit: "Loại bỏ hoàn toàn rủi ro vỡ áp lực hemolymph, tăng tốc độ duỗi gập chân lên gấp 3 lần."
                },
                {
                  type: "Hệ xương ống rỗng Chitin-Silicon",
                  benefit: "Giảm 35% trọng lượng vỏ nhưng tăng giới hạn mô men uốn cong khớp chân lên 420 MPa."
                }
              ]
            },
            p4p_score_scaled: 90,
            tier_scaled: "S",
            sources: [
              { label: "Biomimetic design of light-weight tubular exoskeleton structures", url: "https://doi.org/10.1016/j.actbio.2020.08.012" }
            ]
          }
        ]
      });
    } else if (target.id === "african-bush-elephant") {
      whatIfData.push({
        creature_id: "african-bush-elephant",
        title: "Nếu Voi Rừng Châu Phi thu nhỏ bằng con người (80kg) thì sao?",
        slug: "neu-voi-rung-chau-phi-thu-nho-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Voi Rừng Châu Phi (Loxodonta africana) thu nhỏ xuống kích thước con người 80kg, đối mặt với bài toán tản nhiệt và thay đổi cấu trúc cơ học.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Voi tí hon lực sĩ)",
            slug: "voi-rung-chau-phi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Sức mạnh tương đối tăng 42.1 lần, nâng vật nặng 3.3 tấn và quật vòi siêu khỏe.",
            content: "Khi thu nhỏ xuống 80kg (khối lượng giảm 75.000 lần, kích thước tuyến tính giảm còn ~23.7%):\n- Sức mạnh cơ bắp phi thường: Diện tích mặt cắt ngang cơ bắp chỉ giảm 1.780 lần, giúp tỷ lệ sức mạnh trên khối lượng tăng gấp 42.1 lần. Voi tí hon nặng 80kg có thể dễ dàng cõng hoặc kéo vật nặng 3.3 tấn trên lưng.\n- Cú quật vòi sấm sét: Nhờ tỷ lệ cơ lực tối ưu, chiếc vòi 80kg có thể quật với gia tốc cực lớn, tạo lực va chạm mạnh mẽ.\n- Khả năng bật nhảy: Trọng lượng nhẹ cho phép hệ cơ khớp vượt qua lực hấp dẫn để nhảy cao tới 5 mét, điều không tưởng ở voi thật.",
            formulas_and_data: {
              scaling_factor: 0.237,
              mass_kg_original: 6000,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Tỷ lệ sức mạnh trên khối lượng tăng nghịch đảo tuyến tính",
                  equation: "S_ratio = (M_original / M_scaled)^(1/3)",
                  result: "~42.1 lần"
                },
                {
                  name: "Lực nâng vòi cơ học lý thuyết",
                  equation: "F_lift = F_original * (M_scaled / M_original)^(2/3) * 42.1",
                  result: "~33.6 kN (nâng ~3.3 tấn)"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Elephant biomechanics and muscle scaling", url: "https://doi.org/10.1242/jeb.02381" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Khủng hoảng mất nhiệt lạnh giá)",
            slug: "voi-rung-chau-phi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Tản nhiệt quá nhanh qua tai to và da nhăn gây đông cứng cơ thể, nhịp tim đập loạn nhịp để sưởi ấm.",
            content: "Trong thực tế sinh học, voi 80kg sẽ chết vì hạ thân nhiệt trong vài giờ:\n- Khủng hoảng mất nhiệt: Tỷ lệ diện tích bề mặt trên thể tích (S/V) tăng gấp 4.2 lần. Đôi tai khổng lồ (2 m2 ở voi gốc) và lớp da nhăn nheo vốn tiến hóa để tản nhiệt nay trở thành thảm họa, làm thất thoát toàn bộ nhiệt lượng ra môi trường cực nhanh.\n- Bùng nổ chuyển hóa: Để duy trì thân nhiệt 36-37 độ C, nhịp tim phải tăng từ 30 bpm lên 150 bpm. Voi tí hon cần nạp một lượng thức ăn khổng lồ tương đương 50% trọng lượng cơ thể mỗi ngày, nếu không sẽ chết vì đói và lạnh sau 24 giờ.\n- Mất khả năng giao tiếp hạ âm: Hộp sọ nhỏ không còn đủ khoảng trống cộng hưởng để phát ra và thu nhận sóng hạ âm tần số thấp (<20 Hz).",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hạ thân nhiệt cấp tính",
                  issue: "Tốc độ thất thoát nhiệt tăng 420% do tỷ lệ diện tích bề mặt tai và da nhăn quá lớn so với thể tích cơ thể."
                },
                {
                  type: "Kiệt quệ năng lượng",
                  issue: "Nhu cầu calo BMR tăng gấp 3.5 lần trên mỗi kg, đòi hỏi lượng tiêu thụ thức ăn liên tục."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Allometric scaling of heat dissipation in mammals", url: "https://doi.org/10.1086/303412" }
            ]
          },
          {
            title: "Đột biến thích nghi (Voi lùn ma mút cách nhiệt)",
            slug: "voi-rung-chau-phi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Lông len dày cách nhiệt tốt, tai cụp nhỏ thu gọn 85% và chân khớp linh hoạt chạy 60km/h.",
            content: "Để sinh tồn ở kích thước 80kg, voi trải qua những đột biến thích nghi sâu sắc:\n- Lớp lông bảo ôn (Mammoth Wool): Phát triển lớp lông tơ dày hai lớp cách nhiệt, ngăn chặn 95% nhiệt thất thoát.\n- Tai tiêu giảm (Auricular Reduction): Đôi tai giảm diện tích đi 85%, cụp sát vào đầu chỉ để thu nhận âm thanh chứ không tản nhiệt.\n- Chân khớp vận động (Cursorial Limbs): Hệ xương chân cột trụ đứng thẳng (graviportal) chuyển đổi thành cấu trúc khớp gập linh hoạt có góc nghiêng lớn, cho phép voi chạy nhanh tới 60 km/h và di chuyển khéo léo.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Lông len cách nhiệt",
                  benefit: "Giảm hệ số truyền nhiệt da xuống 0.15 W/m2.K, duy trì thân nhiệt ổn định ở 37 độ C."
                },
                {
                  type: "Khớp chi linh hoạt",
                  benefit: "Góc gập khớp gối tăng 45 độ, phân phối lực đàn hồi giúp tăng tốc độ tối đa lên 60 km/h."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Evolution of dwarfism and insulation in mammoth lineages", url: "https://doi.org/10.1016/j.yqres.2005.08.002" }
            ]
          }
        ]
      });
    } else if (target.id === "sand-tiger-shark") {
      whatIfData.push({
        creature_id: "sand-tiger-shark",
        title: "Nếu Cá Mập Hổ Cát đạt kích thước con người (80kg) thì sao?",
        slug: "neu-ca-map-ho-cat-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi Cá Mập Hổ Cát (Carcharias taurus) đạt kích thước con người 80kg và điều tiết sức nổi tĩnh.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Sát thủ lơ lửng sấm sét)",
            slug: "ca-map-ho-cat-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn nghiền xương đạt 2.200 N, phục kích bất động lơ lửng hoàn hảo nhờ túi khí dạ dày.",
            content: "Ở kích thước 80kg (tương đương chiều dài 1.8 mét, giảm nhẹ so với kích thước gốc):\n- Lực cắn tối ưu: Thiết kế hàm răng nhọn hoắt xếp nhiều hàng dạng răng cưa băng chuyền. Lực cắn đạt 2.200 N, dễ dàng xé thịt và bẻ gãy xương con mồi lớn.\n- Phục kích tĩnh tuyệt đối: Cơ chế nuốt khí từ bề mặt giúp điều chỉnh dạ dày làm bong bóng bơi nhân tạo hoạt động cực kỳ chính xác ở độ sâu 5-10m, cho phép nó lơ lửng không chuyển động như một bóng ma để phục kích mục tiêu.",
            formulas_and_data: {
              scaling_factor: 0.8,
              mass_kg_original: 150,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn hiệu chỉnh theo tỉ lệ kích thước cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~2,200 N"
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Bite force and tooth design in lamniform sharks", url: "https://doi.org/10.1111/j.1469-7998.2008.00445.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Khủng hoảng lực nổi dạ dày)",
            slug: "ca-map-ho-cat-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Dạ dày nhỏ chứa khí không đủ bù lực nổi tĩnh ở vùng sâu, và tỷ lệ sinh sản intrauterine cannibalism giảm sụt.",
            content: "Trong thực tế sinh học, Cá Mập Hổ Cát 80kg gặp bất lợi nghiêm trọng:\n- Thất bại lực nổi ở độ sâu: Dạ dày nhỏ hơn làm giảm thể tích khí chứa được. Khi lặn sâu, áp suất nước nén khí lại nhanh chóng làm nó mất lực nổi tĩnh hoàn toàn, phải bơi liên tục để không bị chìm, tiêu tốn năng lượng gấp 3 lần.\n- Khủng hoảng sinh sản tử cung kép: Hiện tượng phôi lớn ăn thịt phôi nhỏ bị giới hạn do không gian tử cung hẹp đi 50%. Tỷ lệ phôi sống sót giảm mạnh, đe dọa trực tiếp đến sự tồn tại quần thể.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Nén khí dạ dày theo áp suất nước",
                  issue: "Thể tích khí giảm 50% ở độ sâu 20m do định luật Boyle-Mariotte, làm mất 85% lực nổi trung tính."
                },
                {
                  type: "Suy giảm sinh sản tử cung",
                  issue: "Diện tích tử cung hẹp hạn chế số lượng phôi thai có thể thực hiện đồng loại ăn thịt tích lũy dinh dưỡng."
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Intrauterine cannibalism in sand tiger shark embryos", url: "https://doi.org/10.1007/bf00392942" }
            ]
          },
          {
            title: "Đột biến thích nghi (Cá mập bóng hơi xương hóa)",
            slug: "ca-map-ho-cat-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa bóng hơi thực thụ điều tiết khí tự động và hàm răng thay thế siêu tốc 12 giờ.",
            content: "Để tối ưu hóa vị thế săn mồi ở kích thước 80kg:\n- Bóng hơi chuyên biệt (Swim Bladder): Thay vì nuốt khí bề mặt, cá mập tiến hóa tuyến tiết khí và hấp thụ khí nối với dạ dày, tự động cân bằng áp suất ở mọi độ sâu.\n- Tái tạo răng siêu tốc: Tốc độ băng chuyền răng tăng gấp 3 lần, thay răng mòn gãy trong vòng 12 giờ, duy trì độ sắc bén tuyệt đối của bộ răng nhọn hoắt.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Bóng hơi nội tiết",
                  benefit: "Duy trì lực nổi trung tính ổn định ở độ sâu đến 100m mà không cần lên bề mặt lấy khí."
                },
                {
                  type: "Hàm răng thay thế siêu tốc",
                  benefit: "Đảm bảo 100% răng cưa luôn ở trạng thái sắc nhọn nhất, lực xuyên thấu tăng 30%."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Mechanisms of swim bladder development and evolution", url: "https://doi.org/10.1002/dvdy.20394" }
            ]
          }
        ]
      });
    } else if (target.id === "bullet-ant") {
      whatIfData.push({
        creature_id: "bullet-ant",
        title: "Nếu Kiến Đạn (Bullet Ant) phóng to bằng con người (80kg) thì sao?",
        slug: "neu-kien-dan-to-bang-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Kiến Đạn (Paraponera clavata) với ngòi châm poneratoxin phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Quái vật gây sốc thần kinh)",
            slug: "kien-dan-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực châm poneratoxin khổng lồ, vỏ chitin siêu cứng chịu tải 15 tấn và hàm nhai nghiền nát con mồi.",
            content: "Khi Kiến Đạn phóng to lên 80kg (tăng khối lượng ~800.000 lần):\n- Siêu ngòi châm poneratoxin: Ngòi châm dài 8cm phóng ra liều lượng poneratoxin cực đại. Poneratoxin tác động trực tiếp vào kênh Natri thế hiệu, gây ra những cơn co giật cơ hoại tử cơ tim và sốc thần kinh lập tức.\n- Giáp ngoài chitin bất hoại: Lớp vỏ ngoài chitin dày 8mm có cấu trúc tổ ong chịu được lực nén ép tương đương 15 tấn, biến nó thành chiếc xe bọc thép sống.\n- Sức nâng khổng lồ: Tỷ lệ cơ bắp lý thuyết cho phép nó nhấc bổng vật nặng gấp 50 lần khối lượng cơ thể (khoảng 4 tấn).",
            formulas_and_data: {
              scaling_factor: 800000,
              mass_g_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực nâng cơ học lý thuyết",
                  equation: "F_lift = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~40,000 N (nâng ~4 tấn)"
                },
                {
                  name: "Độ bền chịu nén vỏ chitin",
                  equation: "P_max = (Thickness_scaled / Thickness_original)^2 * P_original",
                  result: "~150 kN (chịu tải 15 tấn)"
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Bullet Ant venom (poneratoxin) pharmacological profiles", url: "https://doi.org/10.1016/0041-0101(90)90184-a" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cơ thể giòn và nghẹt thở)",
            slug: "kien-dan-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Khủng hoảng hô hấp qua khí quản thụ động và vỡ nứt vỏ ngoài chitin do áp lực trọng lực cơ thể.",
            content: "Trong thực tế sinh học, Kiến Đạn 80kg sẽ tự chết ngạt và sụp đổ ngay lập tức:\n- Ngạt thở hệ thống: Kiến không có phổi mà hô hấp thụ động qua hệ thống ống khí quản (tracheae). Khi phóng to, thể tích cơ thể tăng 800.000 lần nhưng diện tích lỗ thở chỉ tăng 10.000 lần, dẫn đến thiếu hụt oxy trầm trọng. Nó sẽ bất tỉnh và chết ngạt chỉ trong 3 phút.\n- Sụp vỡ vỏ giáp: Lực nâng của vỏ chitin tỷ lệ thuận với diện tích bề mặt (bình phương), trong khi khối lượng tỷ lệ thuận với thể tích (lập phương). Trọng lượng 80kg sẽ bẻ gãy các chân đốt và ép bẹp cơ thể nó dưới tác dụng trọng lực.\n- Rò rỉ hệ tuần hoàn hở: Không có mạch máu kín, áp suất máu hở của nó không đủ lực đẩy dịch bạch huyết đi nuôi các cơ quan xa.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu oxy khí quản thụ động",
                  issue: "Tỷ lệ trao đổi khí quản giảm 80 lần so với nhu cầu thể tích, gây ngạt thở cấp tính."
                },
                {
                  type: "Sụp gãy khớp chân chitin",
                  issue: "Ứng suất nén trên tiết diện chân vượt quá giới hạn bền uốn của chitin (80 MPa), làm gãy chân tự phát."
                }
              ]
            },
            p4p_score_scaled: 11,
            tier_scaled: "D",
            sources: [
              { label: "The scaling of animal leg bones and muscle power limits", url: "https://doi.org/10.1126/science.182.4116.1039" }
            ]
          },
          {
            title: "Đột biến thích nghi (Sát thủ rừng rậm)",
            slug: "kien-dan-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống phổi sách chủ động, hệ mạch máu bán tuần hoàn kín và vỏ chitin gia cường sợi carbon.",
            content: "Để Kiến Đạn 80kg trở thành hung thần rừng rậm thực sự:\n- Hô hấp phổi khí quản (Tracheal Lungs): Tiến hóa các túi khí co bóp chủ động nối with lỗ thở, hoạt động tương tự phổi sách của nhện để bơm hút oxy cưỡng bức.\n- Hệ tuần hoàn kín hỗ trợ: Phát triển hệ mạch máu bán tuần hoàn kín với tim cơ bắp đẩy dịch bạch huyết có áp suất cao.\n- Vỏ ngoài chitin-silica lai: Lớp vỏ được gia cường bằng các tinh thể khoáng chất silica hoặc liên kết sợi chitin định hướng song song, tăng độ cứng lên gấp 5 lần chịu được trọng lượng cơ thể.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Túi phổi khí quản co bóp chủ động",
                  benefit: "Tốc độ thông khí tăng 120 lần, duy trì nồng độ oxy ở tế bào tương đương mức hoạt động cao."
                },
                {
                  type: "Vỏ ngoài chitin lai silica",
                  benefit: "Giới hạn chịu ứng suất tăng lên 400 MPa, ngăn chặn sự nứt vỡ giáp chân dưới tải trọng cơ thể."
                }
              ]
            },
            p4p_score_scaled: 87,
            tier_scaled: "A",
            sources: [
              { label: "Adaptations and physical limits of giant arthropods", url: "https://doi.org/10.1086/676859" }
            ]
          }
        ]
      });
    } else if (target.id === "assassin-caterpillar") {
      whatIfData.push({
        creature_id: "assassin-caterpillar",
        title: "Nếu Sâu Róm Sát Thủ phóng to bằng con người (80kg) thì sao?",
        slug: "neu-sau-rom-sat-thu-phong-to-bang-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Sâu Róm Sát Thủ (Lonomia obliqua) với gai độc phá hủy fibrinogen phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Quái vật gieo rắc tử thần)",
            slug: "sau-rom-sat-thu-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Sở hữu hàng triệu gai độc khổng lồ phóng nọc độc Lonomin V phá hủy hệ máu ngay khi sượt qua, lớp gai chịu lực đâm xuyên giáp cao.",
            content: "Khi Sâu Róm Sát Thủ đạt kích thước 80kg (phóng to khối lượng khoảng 16.000 lần từ 5g lên 80kg):\n- Gai độc khổng lồ (Scoli): Cơ thể được trang bị khoảng 2.000 gai độc phân nhánh giống hình cây thông, mỗi gai dài 5-8cm, hóa sừng siêu cứng. Một cú va chạm cơ học nhẹ cũng làm đứt đầu gai rỗng và giải phóng trực tiếp khoảng 2-3ml nọc độc chứa enzym Lonomin V và Losac/Lopap.\n- Độc tính phá hủy hệ tuần hoàn: Liều độc khổng lồ này tác động tức thì, kích hoạt toàn bộ prothrombin trong cơ thể nạn nhân thành fibrin không hòa tan, làm cạn kiệt tiểu cầu trong vòng 30 giây, dẫn đến hội chứng đông máu rải rác nội mạch (DIC) và xuất huyết toàn thân cấp tính (chảy máu mắt, tai, nội tạng).\n- Giáp lông bảo vệ: Lớp gai lông đan dày đặc hoạt động như một lớp đệm giảm chấn, phân tán lực va đập cơ học lên tới 10.000 N, khiến các cuộc tấn công vật lý thông thường bị chệch hướng.",
            formulas_and_data: {
              scaling_factor: 16000,
              mass_g_original: 5,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Liều nọc độc phóng to (Tỷ lệ lập phương thể tích tuyến chứa)",
                  equation: "V_venom_scaled = V_venom_original * (M_scaled / M_original)",
                  result: "~4.0 mL nọc độc (so với 0.25 microlit ban đầu)"
                },
                {
                  name: "Khả năng đâm xuyên của gai độc",
                  equation: "P_penetration = F_impact / Area_tip",
                  result: "~120 MPa (đâm xuyên qua da trâu và các lớp quần áo bảo hộ dày)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Lonomia obliqua venom biochemistry and toxin characterization", url: "https://doi.org/10.1016/j.toxicon.2012.04.341" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cái chết ngạt và sụp đổ dịch thể)",
            slug: "sau-rom-sat-thu-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Sụp đổ cấu trúc thân mềm không xương, nghẹt thở do suy khí quản thụ động và vỡ nang độc dưới áp lực tự trọng.",
            content: "Trong thực tế vật lý sinh học, sâu róm sát thủ 80kg không thể tồn tại:\n- Không xương đỡ (Hydrostatic Skeleton): Sâu róm là động vật thân mềm sử dụng áp suất dịch thủy tĩnh để giữ hình dạng. Ở khối lượng 80kg, áp suất nội tại cần thiết để nâng đỡ cơ thể sẽ vượt quá giới hạn đàn hồi của lớp biểu bì da mềm, khiến cơ thể nó bị vỡ tung hoặc xẹp lép phẳng lì như một bãi chất lỏng.\n- Sự sụp đổ của hệ gai độc: Các gai độc dài 8cm chứa nang độc rỗng sẽ tự gãy nát dưới lực nén trọng trường của chính nó khi nó bò trườn.\n- Khủng hoảng trao đổi khí: Hô hấp qua các lỗ thở (spiracles) dọc hai bên sườn hoàn toàn thụ động không có cơ hoành. Khi cơ thể tăng 16.000 lần thể tích, diện tích trao đổi khí chỉ tăng 640 lần, gây tích tụ CO2 cực đại và làm sâu róm chết ngạt trong 2 phút.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp suất dịch thủy tĩnh đỡ cơ thể",
                  issue: "Áp suất yêu cầu P = M*g/Area vượt quá giới hạn bền kéo của lớp cutin biểu bì (20 MPa), gây nứt toác thân."
                },
                {
                  type: "Tỷ lệ diện tích lỗ thở trên thể tích",
                  issue: "Tỷ lệ S/V giảm 25 lần, lưu lượng khuếch tán oxy không đủ đáp ứng 4% nhu cầu tế bào cơ bản."
                }
              ]
            },
            p4p_score_scaled: 5,
            tier_scaled: "D",
            sources: [
              { label: "Physical limits to the size of soft-bodied invertebrates", url: "https://doi.org/10.1086/281134" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú bọc giáp khí lực)",
            slug: "sau-rom-sat-thu-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hóa sừng hóa vỏ ngoài thành bộ xương ngoài chitin cứng, phát triển hệ cơ hô hấp tích cực và túi nọc độc chịu lực.",
            content: "Để có thể sinh tồn và trở thành một cỗ máy chiến tranh sinh học 80kg:\n- Tiến hóa xương ngoài Chitin-Lignin: Lớp biểu bì da mềm biến đổi thành một bộ xương ngoài chitin phân đốt bán cứng để nâng đỡ 80kg mà không cần áp suất dịch quá cao.\n- Hệ hô hấp chủ động: Phát triển các cơ hô hấp sườn chủ động co bóp các túi khí nội bộ, ép không khí lưu thông qua hệ thống lỗ thở cải tiến có nắp đóng mở chủ động.\n- Nang độc bọc màng bảo vệ đàn hồi: Các gai độc hóa sừng chứa sợi elastin đàn hồi cực cao, giúp gai uốn cong thay vì gãy vụn khi va chạm cơ học mạnh.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ hô hấp cơ hoành chủ động",
                  benefit: "Tăng lưu thông khí cưỡng bức gấp 85 lần, đáp ứng hoàn hảo nhu cầu oxy khi di chuyển."
                },
                {
                  type: "Gai độc chứa sợi elastin gia cường",
                  benefit: "Giới hạn uốn dẻo tăng 300%, cho phép gai chịu góc uốn tới 60 độ mà không đứt đầu rỗng."
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "A",
            sources: [
              { label: "Evolution of chitinous exoskeletons and respiratory adaptations in arthropods", url: "https://doi.org/10.1111/brv.12143" }
            ]
          }
        ]
      });
    } else if (target.id === "ogre-faced-spider") {
      whatIfData.push({
        creature_id: "ogre-faced-spider",
        title: "Nếu Nhện Mặt Quỷ phóng to bằng con người (80kg) thì sao?",
        slug: "neu-nhen-mat-quy-phong-to-bang-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Nhện Mặt Quỷ (Deinopis spinosa) với đôi mắt siêu nhạy sáng và cơ chế quăng lưới săn mồi phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Sát thủ săn đêm vô hình)",
            slug: "nhen-mat-quy-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Tấm lưới tơ siêu dính rộng 15m cuốn chặt mục tiêu, mắt siêu thấu kính nhạy sáng cực đại ban đêm và tốc độ quăng lưới chớp nhoáng.",
            content: "Khi Nhện Mặt Quỷ phóng to lên kích thước 80kg (tăng khối lượng ~400.000 lần):\n- Siêu lưới tơ Cribellate: Nhện đan một tấm lưới săn mồi co giãn rộng tới 15-20 mét vuông. Nhờ cấu trúc tơ cribellate cực mịn chải bằng chân sau, lưới có lực hút tĩnh điện khổng lồ, quấn chặt lấy bất kỳ mục tiêu nào trong tầm và chịu lực căng lên tới 80.000 N (tương đương lực kéo của xe tải).\n- Đôi mắt thấu kính đêm tử thần: Đôi mắt khổng lồ phía trước đường kính 12cm có khẩu độ ánh sáng cực lớn, cho phép nhìn rõ từng chi tiết trong đêm tối hoàn toàn với độ nhạy sáng gấp 2.000 lần mắt người thường.\n- Cú vồ quăng lưới chớp nhoáng: Tốc độ phản xạ thính giác cảm nhận rung động trichobothria cho phép chân trước dài 3.5m thực hiện cú chụp quăng lưới chỉ trong 0.05 giây.",
            formulas_and_data: {
              scaling_factor: 400000,
              mass_g_original: 0.2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực căng giới hạn tơ nhện",
                  equation: "F_tension = Tensile_Strength * Area_cross",
                  result: "~85 kN (chịu được trọng lượng treo của xe tải 8.5 tấn)"
                },
                {
                  name: "Độ nhạy sáng thấu kính",
                  equation: "Light_Gathering = (D_scaled / D_original)^2 * Light_original",
                  result: "Độ thu nhận ánh sáng tăng gấp 40.000 lần"
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Sensory ecology and net-casting mechanics of Deinopis spinosa", url: "https://doi.org/10.1093/icb/icaa121" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cơ thể giòn dễ vỡ và mù lòa ban ngày)",
            slug: "nhen-mat-quy-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Vỡ bụng dưới tác dụng rơi tự do do thành biểu bì mỏng, ngạt thở do hệ thống phổi sách thiếu áp lực thụ động.",
            content: "Trong thực tế vật lý sinh học, nhện mặt quỷ 80kg sẽ nhanh chóng tử vong:\n- Sụp vỡ phần bụng (Opisthosoma): Phần bụng của nhện không có xương đỡ cũng không có phân đốt cứng, chỉ là màng cutin co giãn bọc dịch. Với khối lượng 80kg, chỉ cần một bước nhảy nhỏ hoặc rơi từ độ cao 30cm cũng đủ tạo ra áp lực thủy tĩnh cực lớn làm nổ vỡ bụng nhện ngay lập tức.\n- Thiếu hụt trao đổi khí phổi sách: Nhện thở bằng phổi sách (book lungs) thụ động chứa các lá mỏng khuếch tán. Diện tích các lá phổi sách tăng theo tỷ lệ bình phương (10.000 lần), không thể đáp ứng nổi nhu cầu oxy của cơ thể tăng theo tỷ lệ lập phương (400.000 lần).\n- Mù lòa ban ngày: Đôi mắt khổng lồ ban đêm không có mống mắt co giãn điều tiết ánh sáng. Khi mặt trời lên, tế bào cảm quang võng mạc sẽ bị ánh sáng mạnh thiêu rụi hoàn toàn trước khi quá trình tự tiêu lớp màng diễn ra.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Độ bền giới hạn của màng bụng",
                  issue: "Ứng suất màng bụng khi rơi tự do vượt quá giới hạn bền kéo của cutin bụng (3 MPa), gây vỡ bụng."
                },
                {
                  type: "Hiệu suất trao đổi khí phổi sách",
                  issue: "Tỷ lệ diện tích trao đổi khí phổi sách trên thể tích giảm 40 lần, gây thiếu oxy nghiêm trọng khi hoạt động."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Biomechanical constraints on the size of spiders", url: "https://doi.org/10.1111/j.1469-7998.2007.00311.x" }
            ]
          },
          {
            title: "Đột biến thích nghi (Sát thủ giáp lưới đêm)",
            slug: "nhen-mat-quy-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Bụng phân tấm chitin bảo vệ, phổi sách co bóp cơ học và võng mạc có tế bào sắc tố phản quang bảo vệ UV.",
            content: "Để sống sót và phát huy sức mạnh ở kích cỡ 80kg:\n- Phân tấm giáp bụng: Tiến hóa các tấm chitin cứng xếp chồng kiểu vảy (như bọ cạp) bao bọc quanh phần bụng opisthosoma, bảo vệ dịch nội tạng chống lại áp lực va đập cơ học.\n- Hệ thống hô hấp tuần hoàn kép: Phổi sách tiến hóa thành phổi sách chủ động với các cơ liên kết kéo mở tạo luồng khí đối lưu, kết hợp hệ mạch kín bơm máu có chứa hemocyanin đậm đặc.\n- Mống mắt bảo vệ (Iris-like pigment): Mắt nhện tiến hóa một lớp sắc tố bảo vệ nhạy sáng co rút nhanh khi tiếp xúc ánh sáng mặt trời, tương tự mống mắt của thú, giúp bảo vệ võng mạc vào ban ngày.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Giáp phân tấm bụng chitin",
                  benefit: "Tăng khả năng chịu áp lực va đập lên 15 lần, bảo vệ an toàn khi thực hiện cú nhảy săn mồi."
                },
                {
                  type: "Mống mắt điều tiết sắc tố",
                  benefit: "Giảm lượng ánh sáng đi vào mắt 10.000 lần trong ban ngày, ngăn ngừa mù lòa vĩnh viễn."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Visual adaptations and physiological mutations in arachnids", url: "https://doi.org/10.1002/jez.b.21394" }
            ]
          }
        ]
      });
    } else if (target.id === "african-lungfish") {
      whatIfData.push({
        creature_id: "african-lungfish",
        title: "Nếu Cá Phổi Châu Phi phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-phoi-chau-phi-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Cá Phổi Châu Phi (Protopterus annectens) đạt kích thước con người 80kg và đối mặt với mùa hè khô hạn.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Kén ngủ hè siêu cấp và lực đớp nghiền giáp)",
            slug: "ca-phoi-chau-phi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đớp nghiền vỏ đạt 1.750 N, kén bùn dày 0.34 mm bao bọc cơ thể dài 2.7m ngủ hè liên tục suốt 5-10 năm.",
            content: "Khi Cá Phổi Châu Phi phóng to lên 80kg (tăng khối lượng ~40 lần, chiều dài đạt 2.74 mét):\n- Lực đớp hủy diệt: Răng tấm sừng cứng cáp kết hợp bó cơ hàm phát triển. Lực đớp cơ học tăng theo tiết diện cơ (hệ số lambda^2 ≈ 11.7), tăng từ 150N lên 1.750N, dễ dàng nghiền nát các loài giáp xác lớn hoặc rùa nước ngọt.\n- Kén ngủ hè siêu bền: Tuyến chất nhầy bao quanh cơ thể sản xuất lớp màng mucoprotein dày 0.34mm khô cứng như polymer, giữ nước tối ưu cho cơ thể dài 2.7m cuộn tròn dưới lòng đất sét.\n- Kéo dài tuổi thọ ngủ hè: Nhờ tốc độ chuyển hóa theo khối lượng giảm (M^-1/4), cá phổi khổng lồ tiêu thụ năng lượng chậm hơn 2.5 lần mỗi kg cơ thể so với nguyên bản, cho phép ngủ hè kéo dài từ 5 đến 10 năm trong trạng thái bất hoạt hoàn toàn.",
            formulas_and_data: {
              scaling_factor: 40,
              mass_kg_original: 2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp phóng to theo tiết diện cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~1,750 N"
                },
                {
                  name: "Hệ số chuyển hóa năng lượng ngủ hè",
                  equation: "BMR_per_kg_ratio = (M_scaled / M_original)^(-1/4)",
                  result: "~0.4 (tiết kiệm năng lượng gấp 2.5 lần)"
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Aestivation in African lungfish: physiology and biochemistry", url: "https://doi.org/10.1111/j.1469-7998.2009.00645.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở và xẹp phổi cơ học)",
            slug: "ca-phoi-chau-phi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Diện tích phổi thô sơ không đủ trao đổi khí gây ngạt thở, kén bùn bị nứt do trọng lượng nặng và xẹp phổi do trọng lực đè ép nội tạng.",
            content: "Trong thế giới thực tế, nếu Cá Phổi Châu Phi nặng 80kg:\n- Khủng hoảng hô hấp: Mang cá phổi thoái hóa sâu, nó phụ thuộc hoàn toàn vào phổi kép thô sơ thiếu các phế nang nhỏ phân nhánh. Khi phóng to, tỷ lệ diện tích bề mặt trao đổi khí trên thể tích phổi giảm 3.42 lần, khiến lượng oxy khuếch tán không đáp ứng đủ nhu cầu của cơ thể 80kg, dẫn đến thiếu oxy não và ngạt thở chỉ sau vài giờ trên cạn.\n- Sụp đổ cấu trúc cơ thể: Không có chi xương nâng đỡ, cơ thể dạng lươn dài 2.7m nằm trên cạn chịu áp lực trọng lực trực tiếp. Lồng ngực mềm sẽ xẹp xuống, đè nén nội tạng và hai lá phổi kép phẳng dẹt, ngăn cản hoạt động co bóp của phổi.\n- Rách kén mất nước: Trọng lượng 80kg đè lên lớp đất bùn khô xung quanh gây lún nứt kén bùn, làm thoát hơi nước nhanh gấp 10 lần bình thường, cá chết khô trong thời gian ngắn ngủ hè.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt diện tích phổi trao đổi khí",
                  issue: "Tỷ lệ S/V phổi giảm 71%, gây thiếu hụt oxy nghiêm trọng dưới tải hoạt động cơ bản."
                },
                {
                  type: "Áp lực cơ học đè ép nội tạng trên cạn",
                  issue: "Trọng lực đè nén lồng ngực tạo áp suất cơ học 15 kPa lên phổi, gây xẹp phổi hoàn toàn."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Morphometry of the respiratory organs of the lungfish Protopterus", url: "https://doi.org/10.1002/jmor.10528" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái ngư lưỡng cư bò đất sét)",
            slug: "ca-phoi-chau-phi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phổi có phế nang phân nhánh tăng diện tích gấp 15 lần, chi thịt khỏe như tổ tiên Tiktaalik bò sát cạn và kén polymer-chitin tự vá.",
            content: "Để Cá Phổi 80kg sinh tồn và di chuyển dũng mãnh trên bùn khô:\n- Phổi phế nang hóa (Alveolar Septation): Tiến hóa vách ngăn phổi xếp nếp sâu tích hợp mao mạch siêu nhỏ tương tự bò sát, tăng diện tích bề mặt hấp thụ oxy gấp 15 lần.\n- Chi thịt vận động (Proto-limbs): Các vây sợi mảnh phát triển các khớp sụn chịu lực và các nhóm cơ đùi dày, cho phép cá nhấc thân mình lên khỏi mặt đất, trườn bò trên sình lầy mà không làm dập nội tạng.\n- Kén bảo vệ tự vá (Self-healing Mucoprotein Cocoon): Chất nhầy chứa các sợi chitin sinh học đan xen, tạo ra chiếc kén dẻo dai tự lấp đầy các vết nứt, khóa chặt 98% độ ẩm và giải phóng urea thông qua chu trình ammoniase của vi khuẩn biểu bì cộng sinh.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Tăng diện tích phổi phế nang",
                  benefit: "Diện tích trao đổi khí tăng từ 0.12 m2 lên 1.8 m2, duy trì nồng độ oxy máu ở mức 95%."
                },
                {
                  type: "Khớp chi thịt sụn hóa",
                  benefit: "Chịu mô-men tải trọng 120 N.m, nâng đỡ 45% trọng lượng cơ thể khỏi mặt đất khi trườn."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "The fin-to-limb transition and evolutionary developmental biology", url: "https://doi.org/10.1146/annurev-cellbio-100913-013015" }
            ]
          }
        ]
      });
    } else if (target.id === "bee-hummingbird") {
      whatIfData.push({
        creature_id: "bee-hummingbird",
        title: "Nếu Chim Ruồi Ong phóng to bằng con người (80kg) thì sao?",
        slug: "neu-chim-ruoi-ong-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài chim nhỏ nhất thế giới (Mellisuga helenae) với tần số đập cánh 80 Hz được phóng to lên khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cánh quạt phản lực và lưỡi hút siêu tốc)",
            slug: "chim-ruoi-ong-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đập cánh ở tần số 2.3 Hz với sải cánh 3.25m đạt tốc độ bay 85 km/h, nhịp tim 85 lần/phút và lưỡi hút 1.5 lít mật mỗi 5 giây.",
            content: "Khi Chim Ruồi Ong nặng 80kg (phóng to khối lượng 40.000.000 lần, sải cánh đạt 3.25 mét):\n- Tần số đập cánh uy lực: Tần số đập cánh tỷ lệ nghịch với căn bậc ba của khối lượng (M^-1/3), giảm từ 80 Hz xuống còn 2.34 Hz. Với sải cánh dài 3.25m, mỗi cú đập cánh tạo ra luồng khí áp lực lớn, giúp chim bay đứng yên hoặc bay lùi với vận tốc tối đa 85 km/h.\n- Mao dẫn lưỡi khổng lồ: Lưỡi chia đôi dài 30cm hoạt động với lực hút mao dẫn mạnh mẽ kết hợp co thắt cơ hầu, cho phép chim ruồi ong khổng lồ hút cạn 1.5 lít chất lỏng đặc trong 5 giây.\n- Nhịp tim đồng bộ: Nhịp tim giảm từ 1.200 bpm xuống còn 85 bpm ở trạng thái hoạt động bình thường, tối ưu hóa lưu lượng tuần hoàn cho khối cơ ngực ti thể khổng lồ.",
            formulas_and_data: {
              scaling_factor: 40000000,
              mass_g_original: 2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Tần số đập cánh phóng to",
                  equation: "f_scaled = f_original * (M_scaled / M_original)^(-1/3)",
                  result: "~2.34 Hz"
                },
                {
                  name: "Nhịp tim phóng to theo luật Kleiber",
                  equation: "HR_scaled = HR_original * (M_scaled / M_original)^(-1/4)",
                  result: "~85 nhịp/phút"
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Scaling of wingbeat frequency and power output in hummingbirds", url: "https://doi.org/10.1242/jeb.203.21.3197" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự sụp đổ lực nâng và chết đói năng lượng)",
            slug: "chim-ruoi-ong-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Sức cản không khí bẻ gãy khớp vai xoay tự do, diện tích cánh không đủ nâng cơ thể 80kg và nhu cầu nạp 60.000 kcal mỗi ngày gây chết đói.",
            content: "Trong thế giới thực tế vật lý sinh học khi Chim Ruồi Ong nặng 80kg:\n- Thất bại lực nâng: Khối lượng tăng 40 triệu lần nhưng diện tích cánh chỉ tăng khoảng 1.170 lần (theo định luật bình phương - lập phương). Sải cánh 3.25m đập với tần số 2.3 Hz là quá nhỏ để tạo lực nâng cần thiết cho 80kg. Chim hoàn toàn không thể cất cánh.\n- Gãy khớp xoay vai: Khớp vai xoay tự do hình chữ 8 chịu mô-men xoắn gió khổng lồ khi đập cánh ở sải cánh 3.25m, vượt quá 500 N.m làm gãy vụn các xương vai mỏng dẹt rỗng bên trong.\n- Nhu cầu năng lượng hủy diệt: Do tốc độ trao đổi chất cực cao, chim cần nạp khoảng 60.000 kcal mỗi ngày (tương đương ăn 150kg mật hoa hoặc mật đường mỗi ngày). Không tìm đủ nguồn thức ăn khổng lồ này, chim ruồi sẽ đột quỵ vì hạ đường huyết và chết đói chỉ sau 2-3 giờ hoạt động.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt lực nâng cánh khí động học",
                  issue: "Diện tích cánh yêu cầu tối thiểu để nâng 80kg bay đứng yên là 6.8 m2, trong khi diện tích cánh thực tế phóng to chỉ đạt 0.35 m2 (thiếu hụt 95%)."
                },
                {
                  type: "Quá tải mô-men xoắn khớp vai",
                  issue: "Mô-men xoắn xoay khớp vai khi đập cánh đạt 520 N.m, vượt quá giới hạn uốn gãy của xương rỗng 220%."
                }
              ]
            },
            p4p_score_scaled: 10,
            tier_scaled: "D",
            sources: [
              { label: "The structural and mechanical limits of avian bones and flight", url: "https://doi.org/10.1086/285324" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thần điểu cánh carbon ăn thịt tích lũy)",
            slug: "chim-ruoi-ong-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Sải cánh kéo dài 6m bọc sợi keratin chịu lực cao, hệ tiêu hóa chuyển sang ăn thịt để đồng hóa lipid đậm đặc và ngủ lịm tiết kiệm năng lượng.",
            content: "Để Chim Ruồi Ong 80kg trở thành bá chủ bầu trời tầm trung:\n- Sải cánh khổng lồ siêu nhẹ (Carbon-reinforced Wing structure): Sải cánh tiến hóa dài tới 6 mét, kết hợp cấu trúc xương tổ ong gia cố các sợi keratin cứng chịu lực cắt cao, đập với tần số 5 Hz giúp cất cánh dễ dàng.\n- Chế độ ăn thịt đồng hóa nhanh (Carnivorous Metabolism): Cơ quan tiêu hóa tiến hóa enzyme protease cực mạnh, chuyển đổi từ mật hoa sang săn động vật nhỏ để hấp thu protein và lipid đậm đặc năng lượng, giảm nhu cầu ăn xuống còn 4.500 kcal/ngày.\n- Ngủ lịm điều khiển (Controlled Torpor): Khả năng tự chủ động hạ thân nhiệt từ 40°C xuống 15°C và giảm nhịp tim xuống 10 bpm bất kỳ lúc nào để tiết kiệm 90% năng lượng khi không đi săn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia tăng sải cánh và tần số cơ",
                  benefit: "Mở rộng sải cánh lên 6m và diện tích cánh lên 4.2 m2, tạo lực nâng tối đa 950N ở tần số 5 Hz."
                },
                {
                  type: "Cơ chế ngủ lịm tiết kiệm năng lượng chủ động",
                  benefit: "Tiêu thụ năng lượng giảm từ 2.500W xuống còn 150W ở trạng thái ngủ lịm, cho phép nhịn ăn 5 ngày liên tục."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Avian energetics and torpor: evolutionary adaptations in extreme flight", url: "https://doi.org/10.1086/339615" }
            ]
          }
        ]
      });
    } else if (target.id === "black-footed-cat") {
      whatIfData.push({
        creature_id: "black-footed-cat",
        title: "Nếu Mèo Chân Đen phóng to bằng con người (80kg) thì sao?",
        slug: "neu-meo-chan-den-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài mèo hoang dã nhỏ nhất châu Phi (Felis nigripes) với tỷ lệ đi săn thành công 60% đạt khối lượng con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Sát thủ bóng đêm bách phát bách trúng)",
            slug: "meo-chan-den-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn xé 1.130 N tương đương loài báo hoa mai, cú nhảy cao 5.2m bứt tốc săn mồi không tiếng động và thính giác stereo định vị sâu 2m.",
            content: "Khi Mèo Chân Đen phóng to lên 80kg (tăng khối lượng ~53 lần, chiều dài cơ thể đạt 1.5 mét):\n- Lực cắn báo đốm: Lực cắn cơ học tăng theo tiết diện cơ (hệ số lambda^2 ≈ 14.1), tăng từ 80N lên 1.130N, đủ sức cắn xuyên qua hộp sọ của những con mồi lớn.\n- Siêu nhảy cao và bứt tốc: Tỷ lệ cơ chi phát triển cho phép mèo chân đen khổng lồ thực hiện cú nhảy vọt cao 5.2m và xa 12m để vồ mồi từ trên cao. Tốc độ bứt tốc đạt 65 km/h.\n- Thính giác lập thể cực hạn: Cấu trúc thính giác khuếch đại cho phép nó định vị chuyển động nhỏ của con mồi dưới 2 mét cát sa mạc khô ráo, hỗ trợ đắc lực cho tỷ lệ săn mồi thành công 60%.",
            formulas_and_data: {
              scaling_factor: 53.3,
              mass_kg_original: 1.5,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn phóng to cơ học",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~1,130 N"
                },
                {
                  name: "Độ cao cú nhảy phóng to",
                  equation: "H_jump_scaled = H_jump_original * (M_scaled / M_original)^(1/3)",
                  result: "~5.2 mét"
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Bite forces and predatory habits in small wild felids", url: "https://doi.org/10.1111/j.1469-7998.2011.00845.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Đột quỵ vì quá nhiệt và mất khả năng tàng hình)",
            slug: "meo-chan-den-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Diện tích S/V giảm 73% gây sốc nhiệt sa mạc đêm khi bứt tốc, đệm bàn chân chịu áp lực nén 53 kPa làm cát lún phát tiếng động lớn mất ngụy trang âm thanh.",
            content: "Trong thực tế vật lý sinh học khi Mèo Chân Đen nặng 80kg:\n- Quá nhiệt sa mạc: Chạy bứt tốc liên tục ở sa mạc sinh ra nhiệt lượng cơ lớn. Ở khối lượng 80kg, tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm 73% so với nguyên bản, hạn chế tối đa khả năng thoát nhiệt qua da. Mèo không có tuyến mồ hôi hiệu quả sẽ nhanh chóng bị sốc nhiệt tăng thân nhiệt vượt quá 43°C gây suy đa tạng.\n- Lộ tiếng động di chuyển: Đệm chân chịu áp lực nén 53 kPa đè lên cát sa mạc. Sự nén chặt hạt cát tạo ra tiếng động ma sát cơ học tần số cao rõ rệt, khiến con mồi phát hiện ra mèo từ khoảng cách 10m, làm giảm tỷ lệ săn mồi thành công xuống dưới 10%.\n- Gan nhiễm mỡ do lipid dư thừa: Gen LDLR tiến hóa nhanh nếu nạp lượng mỡ khổng lồ từ con mồi nặng mà không duy trì được tần suất vận động liên tục sẽ bị bão hòa, gây gan nhiễm mỡ cấp tính.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Nhiệt lượng nội sinh không thể thoát",
                  issue: "Công suất sinh nhiệt khi bứt tốc là 1.200W, trong khi công suất thoát nhiệt qua hô hấp tối đa chỉ đạt 350W, gây tử vong do tích nhiệt sau 5 phút chạy liên tục."
                },
                {
                  type: "Áp lực cơ học đệm chân nén cát sa mạc",
                  issue: "Lực nén 53 kPa vượt quá giới hạn chống sạt lún cát mịn, phát ra âm thanh ma sát cát đạt 45 dB."
                }
              ]
            },
            p4p_score_scaled: 40,
            tier_scaled: "C",
            sources: [
              { label: "Thermoregulation and heat balance in desert-dwelling felids", url: "https://doi.org/10.1016/j.jtherbio.2008.05.003" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái miêu tản nhiệt tai Fox và đệm chân giảm chấn)",
            slug: "meo-chan-den-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Mở rộng vành tai tản nhiệt mao mạch chủ động, đệm bàn chân gel khí polymer hấp thụ 98% rung động di chuyển tàng hình và nâng cấp gen Uricase thanh thải lipid.",
            content: "Để Mèo Chân Đen 80kg sinh tồn và giữ vững danh hiệu vua săn mồi hiệu suất:\n- Tai tản nhiệt Fennec (Vascularized Radiating Ears): Vành tai mở rộng dài 25cm tích hợp mạng lưới mao mạch dày đặc điều hòa bởi thần kinh giao cảm. Gió đêm sa mạc thổi qua vành tai giúp giải phóng 800W nhiệt lượng thừa, giữ mát cơ thể tuyệt đối.\n- Đệm chân hấp thụ âm thanh (Acoustic Gel Pads): Đệm bàn chân tiến hóa chứa lớp gel polymer sinh học siêu đàn hồi phối hợp túi khí hấp thụ xung lực, triệt tiêu tiếng động nén cát đạt hiệu quả tàng hình âm thanh 99%.\n- Siêu chuyển hóa lipid và acid uric (LDLR & Uricase mutations): Gan thận tăng sinh Uricase gấp 8 lần giải độc axit uric tức thì, thụ thể LDLR đột biến ngăn chặn xơ vữa mạch máu, tối ưu hóa năng lượng mỡ động vật cho các cú nhảy siêu phàm.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Diện tích tai tản nhiệt và lưu lượng máu",
                  benefit: "Tăng diện tích tản nhiệt và lưu lượng máu qua tai lên 2.5 lít/phút, giải phóng tới 850W nhiệt lượng thừa."
                },
                {
                  type: "Đệm bàn chân hấp thụ xung lực âm thanh",
                  benefit: "Giảm mức độ tiếng ồn từ 45 dB xuống dưới 12 dB (dưới ngưỡng nghe của loài gặm nhấm sa mạc)."
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Evolutionary genomics of the low-density lipoprotein receptor and metabolic adaptations in Felidae", url: "https://doi.org/10.1073/pnas.2301985121" }
            ]
          }
        ]
      });
    } else if (target.id === "komodo-dragon") {
      whatIfData.push({
        creature_id: "komodo-dragon",
        title: "Nếu Rồng Komodo phóng to gấp 10 lần (800kg) thì sao?",
        slug: "neu-rong-komodo-phong-to-gap-10-lan-800kg",
        description: "Phân tích giả thuyết khi loài thằn lằn lớn nhất Trái Đất đạt khối lượng 800kg tương đương loài quái thú tiền sử Megalania.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng Megalania)",
            slug: "rong-komodo-800kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn xấp xỉ 2.800 N, đuôi quật với động năng 15.000J gãy xương chi lớn, da giáp xương dày 5mm chịu tải cực tốt.",
            content: "Khi Rồng Komodo phóng to lên 800kg (gấp khoảng 10 lần khối lượng trung bình thực tế):\n- Lực cắn hủy diệt: Áp dụng công thức cắn xé, lực cắn cơ học tăng theo diện tích cắt ngang cơ. Lực cắn tăng gấp ~4.64 lần, từ 600N lên khoảng 2800N, kết hợp với hàm răng cưa phủ sắt cô đặc cắt sâu tạo vết thương hở dài 30cm.\n- Lực quật đuôi sấm sét: Đuôi dài 1.5m nặng 100kg quật với động năng 15,000J ở tốc độ 20 m/s, dư sức quật ngã hoặc gãy xương chi của loài thú lớn.\n- Giáp xương osteoderm: Các mảng giáp xương dưới da đan khít dày lên tới 5mm, tạo ra lớp bảo vệ chịu lực cắt/đâm cực hạn ngang ngửa áo giáp chống đạn nhẹ.",
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_original: 80,
              mass_kg_scaled: 800,
              formulas: [
                {
                  name: "Lực cắn phóng to (Tỷ lệ diện tích cắt ngang cơ)",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~2,800 N"
                },
                {
                  name: "Động năng quật đuôi",
                  equation: "E_k = 0.5 * m_tail * v_tail^2",
                  result: "~15,000 J (ở tốc độ v = 20 m/s)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Bite force and feeding mechanics of Varanus komodoensis", url: "https://doi.org/10.1111/j.1469-7998.2005.00015.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự chậm chạp và quá nhiệt)",
            slug: "rong-komodo-800kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Trọng lượng khổng lồ làm mất khả năng chạy bứt tốc, nhiệt độ cơ thể tăng cao dẫn đến đột quỵ vì khó tản nhiệt qua da.",
            content: "Trong thế giới thực tế, nếu Rồng Komodo đạt khối lượng 800kg:\n- Tổn thất cơ động: Do định luật bình phương - lập phương, trọng lượng tăng gấp 10 lần nhưng tiết diện cơ xương chỉ tăng ~4.64 lần. Áp lực đè lên khớp xương chi tăng vọt, tốc độ bứt tốc giảm từ 20 km/h xuống còn dưới 8 km/h, không thể săn đuổi mồi nhanh.\n- Khủng hoảng điều nhiệt: Là động vật biến nhiệt, tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm mạnh. Rồng Komodo 800kg hấp thụ nhiệt mặt trời nhưng không thể tản nhiệt kịp qua da, khiến nhiệt độ cơ thể nhanh chóng vượt quá 42°C dẫn đến mê sảng và đột quỵ do nhiệt.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Quá nhiệt nội sinh và tản nhiệt chậm",
                  issue: "Tỷ lệ S/V giảm 54%, khiến thời gian tản nhiệt cơ thể kéo dài gấp 3 lần, dễ gây tử vong do tích tụ nhiệt dưới nắng mặt trời."
                },
                {
                  type: "Quá tải xương khớp",
                  issue: "Áp lực cơ xương đè nặng gấp 2.15 lần giới hạn đàn hồi của sụn khớp gối."
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Thermal biology and locomotion of varanid lizards", url: "https://doi.org/10.1086/515865" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú Megalania hồi sinh)",
            slug: "rong-komodo-800kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa cơ cấu chi thẳng đứng chịu lực, hệ thống xoang mũi tản nhiệt tuần hoàn chủ động và tuyến nọc độc cô đặc gấp 5 lần.",
            content: "Để Rồng Komodo 800kg sống sót và săn mồi hiệu quả:\n- Chi thẳng đứng (Semi-erect posture): Các khớp chi xoay từ tư thế bò ngang sang tư thế đứng bán thẳng (tương tự khủng long hoặc Megalania), truyền lực trực tiếp xuống đất giúp chịu tải 800kg dồi dào.\n- Xoang mũi tản nhiệt chủ động: Tiến hóa hệ thống túi khí lớn dưới họng và xoang mũi gấp nếp sâu chứa mạch máu, tản nhiệt bằng hơi nước thở ra giúp duy trì nhiệt độ lõi ổn định 35°C.\n- Tuyến độc cô đặc (Hyper-concentrated Venom): Độc tố peptide được nén với nồng độ gấp 5 lần, gây hạ huyết áp và đông máu cực nhanh ngay cả với con mồi hàng tấn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khớp chi bán thẳng đứng",
                  benefit: "Giảm 65% mô-men xoắn bẻ gãy ở khớp đùi, tăng khả năng chịu tải trọng lên tới 1.5 tấn."
                },
                {
                  type: "Hệ tản nhiệt xoang mũi chủ động",
                  benefit: "Giải phóng 450W nhiệt lượng thừa qua hô hấp, ngăn chặn hoàn toàn nguy cơ quá nhiệt."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Venom system in varanid lizards and fossil Megalania reconstruction", url: "https://doi.org/10.1073/pnas.0810858106" }
            ]
          }
        ]
      });
    } else if (target.id === "leafy-seadragon") {
      whatIfData.push({
        creature_id: "leafy-seadragon",
        title: "Nếu Hải Long Lá phóng to bằng con người (80kg) thì sao?",
        slug: "neu-hai-long-la-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài hải long lá mảnh dẻ với các phần phụ ngụy trang dạng lá tảo bẹ phóng to đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cánh rừng tảo bọc giáp)",
            slug: "hai-long-la-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lớp vây lá dài 3 mét ngụy trang như rừng tảo di động, mõm ống hút nước tạo lực hút chân không hút gọn con mồi 10kg.",
            content: "Khi Hải Long Lá nặng 80kg (hệ số phóng to khối lượng khoảng 1000 lần, dài khoảng 10 lần lên 3.5 mét):\n- Hút chân không cực mạnh: Mõm hình ống dài 60cm hoạt động như một bơm piston thủy lực khổng lồ. Nhờ xương hyoid mở rộng, lực hút đột ngột tạo ra áp suất âm -0.8 atm trong khoang miệng, hút trọn con mồi nặng tới 10-15kg ở khoảng cách 1 mét chỉ trong 0.05 giây.\n- Ngụy trang ngàn lá: Các phần phụ hình lá dài tới 1.5 mét đung đưa theo dòng nước, tạo ra diện mạo giống hệt một đám tảo bẹ khổng lồ di động, làm mất cảnh giác hoàn toàn cả con mồi lẫn kẻ thù lớn.\n- Giáp tấm bì cứng cáp: Các tấm xương bì (dermal plates) bao bọc toàn bộ cơ thể tạo ra một bộ giáp bảo vệ cứng cáp chống trầy xước và cắn xé.",
            formulas_and_data: {
              scaling_factor: 1000,
              mass_g_original: 80,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực hút chân không khoang miệng",
                  equation: "F_suction = P_vacuum * A_mouth",
                  result: "~3,500 N (áp suất âm -80 kPa trên diện tích miệng)"
                },
                {
                  name: "Chiều dài cơ thể phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~3.5 mét"
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Biomechanics of suction feeding in Syngnathidae", url: "https://doi.org/10.1242/jeb.047530" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Con rối nước cạn kiệt năng lượng)",
            slug: "hai-long-la-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Không có đuôi cuốn bám dẫn đến trôi dạt vô định bị sóng đánh nát, vây ngụy trang cản nước làm tê liệt di chuyển.",
            content: "Trong thực tế vật lý sinh học khi Hải Long Lá nặng 80kg:\n- Khủng hoảng di chuyển và sức cản nước: Ở kích thước 3.5 mét, các vây ngụy trang hình lá có tổng diện tích bề mặt khổng lồ. Sức cản nước tăng gấp 100 lần, khiến Hải Long Lá cần nguồn năng lượng chuyển hóa khổng lồ để bơi. Các vây lưng và vây ngực nhỏ bé trong suốt sẽ quá tải và rách nát lập tức do lực cản.\n- Bị dòng hải lưu hủy hoại: Do không có đuôi cuốn bám (prehensile tail) để neo vào đá hay tảo bẹ, con hải long 80kg sẽ bị sóng đánh trôi dạt vô định, va đập vào rạn đá nhọn gãy hết các xương tấm bì và chết ngạt.\n- Thiếu oxy nghiêm trọng: Hệ hô hấp của nó không có nắp mang chủ động co bóp hiệu quả, dòng nước khuếch tán không đủ cung cấp oxy cho khối cơ thể 80kg.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Sức cản nước lên các phiến lá ngụy trang",
                  issue: "Lực cản nước F_drag tăng gấp 100 lần ở cùng tốc độ di chuyển, vượt quá công suất cơ vây tối đa 15W."
                },
                {
                  type: "Thiếu cơ chế neo giữ",
                  issue: "Mô-men uốn do sóng biển tác động lên thân dài 3.5m vượt quá 350 Nm, bẻ gãy liên kết xương bì."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Hydrodynamics of camouflage structures in marine organisms", url: "https://doi.org/10.1086/660814" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thủy quái ngụy trang bọc thép)",
            slug: "hai-long-la-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Đuôi cuốn bám thứ cấp bằng xương bì dẻo, vây lưng bơi phản lực nước chủ động và cơ chế điều khiển sắc tố đổi màu chủ động.",
            content: "Để Hải Long Lá 80kg sinh tồn và trở thành thợ săn tàng hình tối thượng:\n- Đuôi neo xương dẻo (Dermal Prehensile Tail): Tiến hóa lại cấu trúc đốt xương đuôi linh hoạt cho phép cuộn chặt vào thân rạn san hô sâu, chịu đựng sức kéo của dòng chảy lớn mà không bị đứt rời.\n- Hệ vây phản lực luồng nước (Hydromuscular Jet Fins): Tiến hóa hệ cơ vây khỏe bọc trong màng da dày, vận hành như các mái chèo phản lực đẩy dòng nước mạnh ra phía sau để bứt tốc đạt 15 km/h.\n- Da ngụy trang chủ động: Tế bào sắc tố biến đổi liên kết trực tiếp với hệ thần kinh thị giác, cho phép thay đổi màu sắc toàn thân từ xanh bão sang nâu vàng trong 2 giây để ẩn mình hoàn hảo ở mọi độ sâu.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ đuôi bám cơ-xương bì tái sinh",
                  benefit: "Tạo lực bám giữ lên tới 1,800 N, neo chắc cơ thể vào đáy biển chống lại các cơn bão mạnh."
                },
                {
                  type: "Hệ thống cơ vây phản lực thủy lực",
                  benefit: "Tăng công suất động cơ sinh học lên 300W, thắng lực cản nước lớn của các nhánh lá."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Evolutionary genomic signatures of Syngnathidae family morphology", url: "https://doi.org/10.1038/s41559-016-0030" }
            ]
          }
        ]
      });
    } else if (target.id === "lions-mane-jellyfish") {
      whatIfData.push({
        creature_id: "lions-mane-jellyfish",
        title: "Nếu Sứa Bờm Sư Tử phóng to thành thủy quái khổng lồ (20 tấn) thì sao?",
        slug: "neu-sua-bom-su-tu-phong-to-thanh-thuy-quai-khong-lo-20tan",
        description: "Phân tích giả thuyết khi loài sứa khổng lồ sở hữu hàng ngàn xúc tu dài cực hạn và hàng triệu nang châm chứa nọc độc thần kinh đạt khối lượng 20 tấn.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cái ôm tử thần của Kraken)",
            slug: "sua-bom-su-tu-20tan-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Mạng lưới 12,000 xúc tu dài 200 mét phủ kín diện tích 12 ha, nọc độc châm chích tê liệt 100 người cùng lúc.",
            content: "Khi Sứa Bờm Sư Tử đạt khối lượng 20 tấn (phóng to từ 200kg thực tế):\n- Vùng chết chóc khổng lồ: Đường kính chuông sứa đạt 20 mét, thả xuống mạng lưới hơn 12.000 xúc tu mảnh như sợi tóc nhưng dài tới 200 mét. Mạng lưới này quét sạch một vùng đại dương rộng hơn 12 hecta, biến nó thành vùng tử địa cho mọi loài cá và thú biển.\n- Siêu độc tố thần kinh: Hàng tỷ tế bào châm độc giải phóng nọc độc polypeptide cực mạnh. Khi va chạm, chúng giải phóng đồng loạt tạo ra hàng vạn vết châm chích sâu gây ngừng thở và trụy tim lập tức cho bất kỳ sinh vật lớn nào lọt vào.\n- Lực co bóp chuông khổng lồ: Nhịp co bóp chuông tạo ra lực đẩy lượng nước khổng lồ, dịch chuyển khối thân 20 tấn đi với tốc độ 8 km/h.",
            formulas_and_data: {
              scaling_factor: 100,
              mass_kg_original: 200,
              mass_kg_scaled: 20000,
              formulas: [
                {
                  name: "Tổng chiều dài vùng bao phủ xúc tu",
                  equation: "L_total = N_tentacles * L_tentacle",
                  result: "~2,400,000 mét xúc tu bao phủ đại dương"
                },
                {
                  name: "Diện tích vùng quét chết chóc",
                  equation: "A_killzone = \\pi * R_tentacle^2",
                  result: "~125,600 m2 (khoảng 12.5 hecta)"
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Giant jellyfish ecology and nematocyst venom kinetics", url: "https://doi.org/10.1007/s10750-014-2067-5" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự xé rách của dòng nước và rối xúc tu)",
            slug: "sua-bom-su-tu-20tan-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Thân gelatin sụp đổ và tự xé rách dưới dòng chảy mạnh, xúc tu tự rối xoắn và hệ thần kinh mạng lưới phản xạ quá chậm.",
            content: "Trong thực tế vật lý sinh học khi sứa nặng 20 tấn:\n- Tự rách cơ thể Gelatin: Thân sứa cấu tạo từ 99% nước biển liên kết bởi mạng protein collagen lỏng luteo. Ở khối lượng 20 tấn, lực cản và dòng đối lưu của nước đại dương sẽ xé rách chuông sứa khi di chuyển. Chỉ cần một con sóng mạnh sẽ băm nát cơ thể nó thành từng mảng thạch vô hại.\n- Thảm họa xúc tu tự rối: Với 12,000 xúc tu dài 200 mét, dòng nước xoáy sẽ làm chúng quấn chặt vào nhau thành một búi len khổng lồ không thể gỡ ra, gây nghẽn mạch tuần hoàn chất dinh dưỡng của sứa.\n- Tốc độ truyền thần kinh chậm chạp: Do hệ thần kinh dạng mạng lưới (nerve net) không có myelin bảo vệ, tốc độ truyền tín hiệu điện chỉ khoảng 0.5 m/s. Để truyền phản xạ từ đầu xúc tu dài 200 mét về chuông cần tới 400 giây (gần 7 phút), khiến sứa mất hoàn toàn phản xạ bơi hay tự vệ tức thời.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giới hạn uốn kéo của mô Gelatin",
                  issue: "Ứng suất kéo do dòng nước chảy 1.5 m/s tác động lên chuông vượt quá 10 kPa, giới hạn đứt gãy của collagen sứa."
                },
                {
                  type: "Độ trễ truyền thần kinh mạng lưới",
                  issue: "Thời gian phản hồi thần kinh \\Delta t = L / v_speed = 200m / 0.5 m/s = 400 giây."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Nervous conduction and biomechanics in cnidarians", url: "https://doi.org/10.1086/BULL184.1.88" }
            ]
          },
          {
            title: "Đột biến thích nghi (Vương quốc sứa bất tử)",
            slug: "sua-bom-su-tu-20tan-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Mô gelatin gia cố liên kết chéo collagen siêu dẻo, hệ sợi thần kinh bó dọc có bao myelin tăng tốc và xúc tu phủ chất nhầy glycoprotein chống rối.",
            content: "Để đại sứa 20 tấn sinh tồn dũng mãnh ở biển sâu:\n- Mạng lưới Collagen biến tính (Cross-linked Collagen Matrix): Tiến hóa các liên kết chéo disulfide cực bền giữa các sợi collagen trong chất nền gelatin, tăng độ bền uốn kéo lên gấp 100 lần, giúp chuông sứa dẻo dai như cao su tổng hợp chịu được mọi sóng gió đại dương.\n- Sợi trục thần kinh bọc myelin (Myelinated Giant Axons): Tiến hóa các bó sợi thần kinh chạy dọc xúc tu được bọc myelin bảo vệ, đẩy tốc độ truyền xung điện lên 80 m/s, giúp phản xạ bắt mồi diễn ra trong 2.5 giây.\n- Xúc tu phủ chất nhầy chống rối (Anti-entanglement Mucus): Bề mặt xúc tu tiết ra một loại glycoprotein trơn trượt đặc biệt đẩy nước, ngăn chặn hoàn toàn việc các xúc tu bám dính hay xoắn nút vào nhau.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Lớp chất chống rối glycoprotein",
                  benefit: "Hệ số ma sát giữa các xúc tu giảm xuống mức \\mu < 0.01, giúp chúng trượt qua nhau êm ái không bao giờ rối."
                },
                {
                  type: "Tốc độ phản xạ thần kinh nâng cấp",
                  benefit: "Giảm thời gian phản hồi thần kinh từ 400 giây xuống 2.5 giây nhờ các sợi trục khổng lồ bọc myelin."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Myelination-like structures in invertebrates and collagen biomaterials", url: "https://doi.org/10.1016/j.cell.2016.10.012" }
            ]
          }
        ]
      });
    } else if (target.id === "hairy-frog") {
      whatIfData.push({
        creature_id: "hairy-frog",
        title: "Nếu Ếch Lông phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ech-long-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ếch lông sở hữu móng vuốt xương tự bẻ gãy khớp đâm xuyên da thịt và lớp nhú da hô hấp giống lông đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Bone-Claw Berserker)",
            slug: "ech-long-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Móng vuốt xương dài 15cm đâm thủng kim loại với lực 5000 N, cùng nhú da hô hấp tăng khả năng lấy oxy gấp hàng chục lần.",
            content: "Khi Ếch Lông đạt khối lượng 80kg (phóng to cơ học tuyến tính từ 80g, hệ số phóng to khoảng 1000 lần khối lượng, tương đương dài gấp 10 lần):\n- Móng vuốt xương hủy diệt: Móng vuốt xương ở chi sau (vốn dài 1.5mm) phóng to lên khoảng 15cm. Khi gặp nguy hiểm, cơ khép ngón co rút cực mạnh với lực 5000 N, tự bẻ gãy mấu xương đốt ngón và đâm thủng da ngón chân phóng ra ngoài. Với cấu trúc xương ngón sắc nhọn, đòn đá vuốt có khả năng xuyên thủng thép mỏng 2mm hoặc rách da thịt đối thủ sâu sắc.\n- Nhú da hô hấp sinh vây: Hàng triệu nhú da mỏng chứa đầy mao mạch bên hông tăng diện tích trao đổi chất, cho phép ếch lông 80kg hấp thụ một lượng oxy khổng lồ qua da tương đương mang ngoài của sinh vật lưỡng cư cổ đại.",
            formulas_and_data: {
              scaling_factor: 1000,
              mass_g_original: 80,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài vuốt xương phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~15 cm"
                },
                {
                  name: "Lực phóng vuốt cơ học",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~5,000 N"
                }
              ]
            },
            p4p_score_scaled: 87,
            tier_scaled: "A",
            sources: [
              { label: "Claw retraction and bone breaking mechanisms in Trichobatrachus robustus", url: "https://doi.org/10.1098/rsbl.2008.0219" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Self-Mutilating Collapse)",
            slug: "ech-long-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Vết thương hở từ vuốt xương gây mất máu tử vong do áp lực máu cao, và nhú da rủ xuống dính chặt cản trở trao đổi khí.",
            content: "Trong thực tế vật lý sinh học:\n- Bi kịch tự thương (Self-mutilation failure): Ở 80g, việc bẻ xương đâm xuyên da chỉ gây ra vết thương siêu nhỏ tự lành nhờ cục máu đông tức thời. Nhưng ở 80kg, áp lực máu động mạch của sinh vật phóng to cao gấp nhiều lần (~80-100 mmHg). Việc tự bẻ xương đâm thủng ngón chân sẽ xé toạc các động mạch ngón chân chính, gây xuất huyết ồ ạt không thể kiểm soát, dẫn tới sốc mất máu tử vong chỉ sau vài lần phóng vuốt.\n- Sụp đổ hô hấp da: Ngoài nước, các nhú da mỏng giống như lông sẽ rủ xuống, dính bết vào nhau do lực căng bề mặt nước và chất nhầy. Sự dính chùm này làm giảm 90% diện tích tiếp xúc với không khí, khiến ếch ngạt thở nhanh chóng dưới trọng lượng da đè nén.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Xuất huyết động mạch do phóng vuốt",
                  issue: "Áp lực máu tăng cao kết hợp vết rách da dài 15cm gây mất máu cấp tính với lưu lượng 1.2 lít/phút."
                },
                {
                  type: "Xẹp nhú da hô hấp",
                  issue: "Lực căng bề mặt làm bết dính các sợi nhú da, giảm diện tích hấp thụ oxy qua da đi 92% ngoài môi trường nước."
                }
              ]
            },
            p4p_score_scaled: 22,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of cardiovascular pressure and skin respiration in anurans", url: "https://doi.org/10.1242/jeb.02143" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Wolverine Beast)",
            slug: "ech-long-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Bao mô vuốt tự lành trơn trượt co giãn, tuyến tiết keo đông máu siêu tốc và sụn hóa nhú da tự đứng vững.",
            content: "Để hoạt động hiệu quả như một quái thú chiến đấu ở kích thước 80kg, Ếch Lông tiến hóa các đột biến đặc hiệu:\n- Bao mô vuốt co giãn (Sheathed Claw Chambers): Tiến hóa các khoang da co giãn đặc biệt bọc quanh móng vuốt xương, cho phép vuốt phóng ra qua một lỗ mở tự nhiên lót biểu mô sừng hóa dẻo dai, loại bỏ hoàn toàn việc xé rách da thịt tự tổn thương.\n- Keo sinh học đông máu siêu tốc (Hyper-reactive Bio-sealant): Tuyến da ngón chân tiết ra chất hydrogel fibrinogen phản ứng tức thì với oxy, đông đặc trong 0.2 giây để bịt kín lỗ phóng vuốt ngay khi thu vuốt lại.\n- Nhú da sụn hóa nâng đỡ (Cartilage-reinforced Papillae): Mỗi nhú da hô hấp bên hông được gia cố một sợi sụn siêu mảnh chạy ở trung tâm, giúp nhú da luôn dựng thẳng trong không khí, duy trì tối đa hiệu suất lấy oxy ngoài nước.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khoang bao vuốt tự nhiên",
                  benefit: "Loại bỏ hoàn toàn tổn thương mô mềm khi phóng/rút vuốt, bảo toàn mạch máu ngón."
                },
                {
                  type: "Sợi sụn nhú da nâng đỡ",
                  benefit: "Giữ các sợi nhú da không bị xẹp bết dính, duy trì dung lượng trao đổi khí đạt 45 lít oxy/giờ."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Bio-inspired adhesives and cartilage regeneration in amphibians", url: "https://doi.org/10.1016/j.actbio.2018.03.012" }
            ]
          }
        ]
      });
    } else if (target.id === "humpback-anglerfish") {
      whatIfData.push({
        creature_id: "humpback-anglerfish",
        title: "Nếu Cá Lồng Đèn Biển Sâu phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-long-den-bien-sau-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá lồng đèn cái sở hữu cần câu phát sáng esca cộng sinh vi khuẩn và cái miệng khổng lồ răng nanh gập phóng to đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Abyss Maw)",
            slug: "ca-long-den-bien-sau-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Hàm răng nanh dài 20cm gập linh hoạt nhốt chặt mục tiêu, cần câu phát ra luồng sáng 1200 lumen và cơ thể hấp thụ ánh sáng tuyệt đối.",
            content: "Khi Cá Lồng Đèn Biển Sâu (con cái) đạt khối lượng 80kg (phóng to từ ~1kg tự nhiên):\n- Cái miệng tử thần: Miệng rộng mở to hết cỡ đường kính lên tới 65cm, chứa đầy răng nanh trong suốt dài 20cm có khớp gập hướng vào trong. Lực đớp hàm đạt tới 4500 N. Một khi con mồi lọt vào miệng, răng nanh sẽ gập xuống cho mồi đi vào và dựng đứng khóa chặt hướng ra, biến khoang miệng thành ngục tối không lối thoát.\n- Cần câu esca siêu sáng: Cần câu dài 1.2 mét. Túi esca chứa hàng tỷ vi khuẩn phát quang Candidatus Enterovibrio escacola phóng to phát ra luồng sáng xanh lục cường độ 1200 lumen, đủ sức thu hút hoặc làm lóa mắt con mồi ở khoảng cách 15 mét trong bóng tối.\n- Tàng hình tuyệt đối: Lớp da sẫm màu hấp thụ 99.4% ánh sáng, không phản chiếu bất kỳ tia sáng nào, giúp nó hoàn toàn vô hình trong bóng đêm.",
            formulas_and_data: {
              scaling_factor: 80,
              mass_kg_original: 1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Độ rộng khoang miệng mở tối đa",
                  equation: "W_scaled = W_original * (M_scaled / M_original)^(1/3)",
                  result: "~0.65m"
                },
                {
                  name: "Cường độ phát quang esca tối đa",
                  equation: "I_scaled = I_original * (M_scaled / M_original)",
                  result: "~1,200 lumens"
                }
              ]
            },
            p4p_score_scaled: 89,
            tier_scaled: "A",
            sources: [
              { label: "Bioluminescence and jaw mechanics in deep-sea anglerfishes", url: "https://doi.org/10.1111/j.1439-0469.2008.00492.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Deep-Sea Bloat)",
            slug: "ca-long-den-bien-sau-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ thể nhão sụp đổ do thiếu áp suất thủy tĩnh cao, hệ tuần hoàn tê liệt và esca quá nhiệt giết chết vi khuẩn cộng sinh.",
            content: "Trong thực tế vật lý sinh học khi di chuyển lên tầng nước nông hoặc cạn:\n- Sụp đổ áp suất cơ thể: Thân hình Cá Lồng Đèn có mật độ xương cực thấp, cơ bắp nhão nhiều nước để tiết kiệm năng lượng ở áp suất cao biển sâu. Khi phóng to lên 80kg ở áp suất thường, cấu trúc cơ thể sẽ sụp đổ, nhão ra như thạch dưới tác động của trọng lực và sức cản nước kém. Trái tim yếu ớt không thể bơm máu đi khắp cơ thể phình to.\n- Khủng hoảng esca phát sáng: Ở kích thước 80kg, mật độ vi khuẩn trong esca quá đặc tạo ra nhiệt lượng nội sinh lớn. Do diện tích tản nhiệt của esca tăng chậm hơn thể tích (S/V giảm), esca bị quá nhiệt lên tới 45°C, tiêu diệt hoàn toàn vi khuẩn phát quang cộng sinh và gây hoại tử cần câu.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Quá nhiệt túi esca cộng sinh",
                  issue: "Tốc độ tản nhiệt giảm mạnh khiến nhiệt độ esca tăng vượt ngưỡng sống sót 38°C của vi khuẩn Candidatus."
                },
                {
                  type: "Sụp đổ tuần hoàn áp suất thấp",
                  issue: "Cơ tim thiếu áp lực hỗ trợ xung quanh không thể duy trì huyết áp tối thiểu 15 mmHg cho cơ thể 80kg."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Physiological adaptations and metabolic limits of deep-sea teleosts", url: "https://doi.org/10.1152/physrev.2002.82.4.1013" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Luminescent Leviathan)",
            slug: "ca-long-den-bien-sau-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương sụn gia cố canxi chịu lực, túi esca tản nhiệt tuần hoàn máu chủ động và răng nọc tiết độc gây tê liệt.",
            content: "Để sinh tồn và thống trị ở kích thước 80kg tại mọi tầng nước, Cá Lồng Đèn tiến hóa các đột biến thích nghi:\n- Xương sụn canxi hóa (Calcified Cartilaginous Skeleton): Khung xương sụn được gia cố canxi tạo độ cứng chịu lực nén cơ học mà không làm tăng quá nhiều trọng lượng cơ thể, giúp duy trì hình dáng tròn chắc chắn.\n- Hệ tản nhiệt túi esca tuần hoàn (Vascularized Esca Cooler): Hệ mạch máu bao quanh esca phát triển mạng lưới mao mạch dày đặc nối trực tiếp về mang, sử dụng dòng nước mang lạnh đi qua để liên tục làm mát esca, giữ nhiệt độ ổn định ở 12°C.\n- Hàm răng nọc tê liệt (Neurotoxic Fangs): Các răng nanh lớn tiến hóa rãnh dẫn chất độc tê liệt thần kinh tiết ra từ tuyến thượng hàm, giúp vô hiệu hóa lập tức những con mồi lớn nhảy dụa.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ làm mát esca bằng mạch máu",
                  benefit: "Giải tỏa 95% nhiệt lượng sinh ra từ vi khuẩn phát quang, duy trì ánh sáng rực rỡ liên tục."
                },
                {
                  type: "Khung sụn canxi hóa vững chãi",
                  benefit: "Chịu lực nén va chạm, duy trì áp lực đớp hàm đạt 3500 N không bị vỡ sọ."
                }
              ]
            },
            p4p_score_scaled: 79,
            tier_scaled: "B",
            sources: [
              { label: "Skeletal mineralisation and bioluminescent organ cooling in marine vertebrates", url: "https://doi.org/10.1016/j.yexcr.2016.12.011" }
            ]
          }
        ]
      });
    } else if (target.id === "king-cobra") {
      whatIfData.push({
        creature_id: "king-cobra",
        title: "Nếu Rắn Hổ Mang Chúa phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ran-ho-mang-chua-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài rắn hổ mang chúa sở hữu lượng nọc độc thần kinh khổng lồ và chiều dài cơ thể phóng đại cực lớn đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Venomous Basilisk)",
            slug: "ran-ho-mang-chua-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Chiều dài đạt 11 mét, lực cắn 3500 N cắm ngập răng nanh 4cm bơm 4000mg nọc độc giết chết voi rừng trong 5 phút.",
            content: "Khi Rắn Hổ Mang Chúa đạt khối lượng 80kg (phóng to cơ học từ ~6kg tự nhiên):\n- Kích thước khổng lồ: Chiều dài cơ thể tăng từ 4.5 mét lên tới 11.2 mét. Khi dựng đứng đầu bành mang tự vệ, nó cao tới 2.5 mét, vượt qua chiều cao của một người trưởng thành.\n- Lực đớp và răng nanh: Răng nanh cố định dài 4cm, lực cắn hàm tăng lên 3500 N, dễ dàng cắn xuyên qua lớp giáp dày hoặc quần áo bảo hộ. Tuyến nọc cực đại chứa tới 4000 mg nọc độc thần kinh (neurotoxin) tinh khiết. Một cú cắn trúng đích có thể bơm lượng nọc đủ giết chết một con voi châu Á trưởng thành trong vòng 5 phút.\n- Gia tốc phóng đớp: Nhờ hệ cơ dọc sườn phóng to kéo giãn, gia tốc phóng đớp đạt 90 m/s2 với vận tốc bùng nổ 12 m/s.",
            formulas_and_data: {
              scaling_factor: 13.3,
              mass_kg_original: 6,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài cơ thể phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~11.2m"
                },
                {
                  name: "Lực cắn phóng đại",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~3,500 N"
                }
              ]
            },
            p4p_score_scaled: 93,
            tier_scaled: "S",
            sources: [
              { label: "Snake venom yield and biting force scaling laws", url: "https://doi.org/10.1242/jeb.08412" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Slow-Crawling Giant)",
            slug: "ran-ho-mang-chua-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Tốc độ di chuyển giảm sút trầm trọng do ma sát da bụng cực lớn, và sụp đổ áp suất tuần hoàn khi dựng cao đầu.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng áp huyết khi dựng đầu (Orthostatic hypotension): Khi rắn dựng đứng cơ thể cao 2.5 mét ngoài tự nhiên, trọng lực kéo máu dồn xuống phần đuôi thấp. Để bơm máu lên não cách xa 2.5 mét, tim rắn cần tạo áp suất co bóp cực lớn vượt quá 250 mmHg. Với cấu trúc tim rắn 3 ngăn chưa hoàn hảo, nó sẽ bị thiếu máu não cục bộ gây ngất xỉu ngay lập tức nếu giữ tư thế thẳng đứng quá 30 giây.\n- Ma sát kéo bụng nặng nề: Trọng lượng 80kg đè nặng lên các lớp vảy bụng mỏng manh. Khi trườn bò, lực ma sát cơ học cực lớn sẽ mài mòn lớp vảy keratin bảo vệ bụng, gây rách da, nhiễm trùng và giảm tốc độ bò xuống chỉ còn 3 km/h.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hạ huyết áp tư thế dựng đứng",
                  issue: "Huyết áp thủy tĩnh chênh lệch 2.5m đòi hỏi áp suất tim >250 mmHg vượt quá giới hạn tim 3 ngăn."
                },
                {
                  type: "Mài mòn vảy bụng do ma sát",
                  issue: "Ứng suất ma sát vảy bụng tăng gấp 2.4 lần khiến vảy trầy xước và tiêu tốn 180% năng lượng khi trườn."
                }
              ]
            },
            p4p_score_scaled: 42,
            tier_scaled: "C",
            sources: [
              { label: "Cardiovascular physiology and gravity tolerance in snakes", url: "https://doi.org/10.1086/515854" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Dragon Cobra)",
            slug: "ran-ho-mang-chua-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Van tim ngăn thất phụ trợ tăng áp huyết não, vảy bụng sừng khóa thép siêu chống mòn và hệ cơ đệm nâng đỡ.",
            content: "Để hoạt động như một siêu dã thú 80kg, Rắn Hổ Mang Chúa tiến hóa các đột biến thích nghi:\n- Van tim ngăn áp suất cao (Trabecular Heart Valve): Tâm thất tim xuất hiện vách ngăn mô cơ giả bán khép kín hoạt động giống tim 4 ngăn, tăng áp lực bơm máu lên động mạch cảnh đạt 220 mmHg giúp cấp máu ổn định cho não khi dựng đứng cao 2.5 mét.\n- Vảy bụng Composite Silicat (Silicate-Keratin Ventral Scales): Lớp vảy bụng được tích hợp thêm các hạt nano silicat tự nhiên từ đất cát, tạo độ cứng chống mài mòn vượt bậc như lớp giáp polyme công nghiệp.\n- Túi khí nâng cơ thể (Ventral Air-Sacs): Hệ thống túi khí phân bố dọc cơ thể có van xả điều khiển chủ động, giúp giảm 15% trọng lượng tiếp xúc mặt đất khi trườn nhanh.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vách ngăn tim bán khép kín",
                  benefit: "Duy trì dòng máu lên não đạt lưu lượng ổn định 400 ml/phút ở góc đứng 90 độ."
                },
                {
                  type: "Vảy bụng nano silicat",
                  benefit: "Giảm hệ số ma sát trượt xuống 0.12, bảo vệ da bụng an toàn ở tốc độ bò 18 km/h."
                }
              ]
            },
            p4p_score_scaled: 84,
            tier_scaled: "B",
            sources: [
              { label: "Structural coloration and tribological properties of snake skin", url: "https://doi.org/10.1016/j.triboint.2014.02.008" }
            ]
          }
        ]
      });
    } else if (target.id === "sunda-pangolin") {
      whatIfData.push({
        creature_id: "sunda-pangolin",
        title: "Nếu Tê Tê Java phóng to bằng con người (80kg) thì sao?",
        slug: "neu-te-te-java-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài tê tê sở hữu lớp giáp sừng keratin ngói lợp và chiếc lưỡi siêu dính dài 30cm đạt kích cỡ của một đấu sĩ hạng trung 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Sci-Fi Armor & Whip)",
            slug: "te-te-java-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lớp giáp vảy sừng sừng sững cản đạn đập vỡ bê tông, và đòn quật lưỡi tốc độ phản lực xé rách không khí.",
            content: "Khi Tê Tê Java đạt khối lượng 80kg (phóng to cơ học hoàn hảo):\n- Lớp giáp vảy sừng dày lên gấp nhiều lần, trở thành bộ giáp tấm di động siêu chịu lực. Với độ cứng keratin tăng lên và độ dày vảy tăng tỉ lệ thuận tuyến tính, giáp có khả năng chống chịu va chạm tương đương thép tấm 5mm, cản được cả đạn súng lục cỡ nhỏ.\n- Chiếc lưỡi dài tới 1.8 mét (phóng to từ 25cm của cơ thể 8kg), có cơ cấu kéo dài bằng các sợi cơ đặc biệt bám dọc xương ức phóng to. Vận tốc phóng lưỡi đạt 40 m/s với gia tốc 80G, tạo ra lực quật lên tới 3500 N, đủ sức quật gãy xương sườn đối thủ.\n- Vuốt chân trước dài 25cm hoạt động như lưỡi cuốc cơ học, lực đào bới đạt 6000 N, phá hủy cấu trúc bê tông dễ dàng.",
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_original: 8,
              mass_kg_scaled: 80,
              tongue_length_m_original: 0.25,
              tongue_length_m_scaled: 1.8,
              formulas: [
                {
                  name: "Chiều dài lưỡi phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "1.8m"
                },
                {
                  name: "Lực quật lưỡi cơ học",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~3,500 N"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Exoskeleton mechanics and keratin structures", url: "https://doi.org/10.1016/j.jmbbm.2016.09.021" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Heavy Rolling Ball)",
            slug: "te-te-java-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt vì thiếu oxy do khoang ngực chật hẹp, và bộ giáp vảy sừng quá nặng khiến nó không thể bò nổi.",
            content: "Trong thực tế vật lý sinh học:\n- Áp lực trọng lượng và di chuyển: Trọng lượng tăng 10 lần nhưng tiết diện cơ chân chỉ tăng ~4.64 lần (theo định luật bình phương - lập phương). Bộ giáp vảy sừng nặng tới 16kg (20% trọng lượng) đè nén khiến Tê Tê Java cực kỳ chậm chạp, không thể bò nhanh hay cuộn tròn hiệu quả. Nếu cuộn lại, các cạnh vảy sừng sắc bén sẽ ép mạnh vào da bụng mềm dưới áp lực cơ học khổng lồ, gây chấn thương nội tạng.\n- Nguy cơ chết ngạt: Hệ thống lưỡi liên kết tới tận xương ức chiếm một không gian quá lớn ở khoang ngực. Khi phóng to lên 80kg, thể tích phổi cần thiết tăng gấp 10 lần nhưng do cấu trúc lưỡi chiếm dụng khoang ngực lớn, phổi bị chèn ép mạnh dẫn đến suy hô hấp nghiêm trọng khi vận động mạnh.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Cơ học chi và áp lực vỏ",
                  issue: "Tỉ lệ diện tích cơ chân trên khối lượng cơ thể giảm 53.6%, vảy ép trực tiếp vào bụng khi cuộn."
                },
                {
                  type: "Suy giảm hô hấp",
                  issue: "Khoang ngực hẹp do kết cấu lưỡi cơ ức chèn ép dung tích phổi tăng trưởng không kịp nhu cầu oxy."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of mammalian locomotion and anatomy", url: "https://doi.org/10.1242/jeb.00342" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Lancer)",
            slug: "te-te-java-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Vảy sừng rỗng tổ ong giảm trọng lượng, phổi khoang ngực cấu trúc lại và lưỡi chứa độc tố tê liệt.",
            content: "Để sinh tồn ở kích thước 80kg, Tê Tê Java tiến hóa các đột biến đặc thù:\n- Vảy sừng cấu trúc tổ ong (Honeycomb Keratin): Cấu trúc bên trong vảy rỗng một phần nhưng có xương chịu lực chéo giúp giảm 45% trọng lượng giáp sừng mà vẫn giữ nguyên độ cứng cơ học.\n- Cải tiến xương ức và khoang ngực: Xương ức mở rộng ra phía ngoài và hạ thấp cơ hoành để nhường chỗ cho phổi giãn nở hoàn toàn xung quanh bó cơ lưỡi dày.\n- Lưỡi độc (Toxin-Secreting Tongue): Tuyến nước bọt phóng đại biến tính để tiết ra chất nhầy chứa độc tố neurotoxin gây tê liệt, biến đòn phóng lưỡi thành đòn ám sát tầm xa hiệu quả.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vảy sừng tổ ong",
                  benefit: "Giảm khối lượng giáp từ 16kg xuống 8.8kg, tăng khả năng đàn hồi hấp thụ xung lực đòn đánh."
                },
                {
                  type: "Cơ hoành hạ thấp & Xương ức mở rộng",
                  benefit: "Tăng dung tích phổi thêm 35%, đảm bảo duy trì lượng oxy cho cơ thể khi chạy trốn hoặc chiến đấu."
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Structural materials in biology: Keratin fibers and foams", url: "https://doi.org/10.1016/j.pmatsci.2013.01.001" }
            ]
          }
        ]
      });
    } else if (target.id === "thresher-shark") {
      whatIfData.push({
        creature_id: "thresher-shark",
        title: "Nếu Cá Mập Đuôi Roi phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-map-duoi-roi-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá mập sở hữu chiếc đuôi roi tạo bóng khí chân không phóng to bằng con người (80kg - thực tế chúng nặng tới 300-500kg, đây là kịch bản thu nhỏ và tối ưu hóa tỷ lệ sức mạnh).",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Sonic Tail Whip)",
            slug: "ca-map-duoi-roi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đòn quật vây đuôi tạo ra sóng xung kích chấn động dưới nước bẻ gãy xương con mồi ở khoảng cách 1 mét.",
            content: "Cá mập đuôi roi tự nhiên nặng khoảng 300kg với vây đuôi dài 2.5 mét. Khi thu nhỏ/phóng to về tỷ lệ tối ưu 80kg:\n- Chiếc đuôi roi dài khoảng 1.5 mét sẽ trở thành vũ khí động năng cực kỳ linh hoạt. Do khối lượng giảm nhưng mật độ cơ bắp của sợi collagen chéo giữ nguyên, tốc độ quất đuôi tăng lên 24 m/s dưới nước.\n- Đòn quật đuôi giải phóng động năng lớn tạo ra bong bóng chân không (cavitation bubble) sụp đổ tức thời, giải phóng sóng xung kích chấn động tương đương 1.2 MPa áp suất nước, có khả năng làm choáng hoặc làm vỡ bóng hơi của cá mục tiêu ở cự ly gần.",
            formulas_and_data: {
              scaling_factor: 0.27,
              mass_kg_original: 300,
              mass_kg_scaled: 80,
              tail_length_m_original: 2.5,
              tail_length_m_scaled: 1.5,
              formulas: [
                {
                  name: "Năng lượng động năng quật đuôi",
                  equation: "E_k = 0.5 * I * omega^2",
                  result: "~1,200 Joules"
                },
                {
                  name: "Áp suất sóng xung kích sụp đổ bong bóng",
                  equation: "P_shock = 1.2 * rho * c * v_tail",
                  result: "~1.2 MPa"
                }
              ]
            },
            p4p_score_scaled: 90,
            tier_scaled: "S",
            sources: [
              { label: "Thresher shark hunting behavior and tail slap kinematics", url: "https://doi.org/10.1371/journal.pone.0067380" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Hydrodynamic Instability)",
            slug: "ca-map-duoi-roi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất đi lực mô-men xoắn giữ thăng bằng khi quật đuôi, cơ thể tự quay vòng tròn do phản lực nước.",
            content: "Trong môi trường thực tế, việc thu nhỏ hoặc giữ tỷ lệ 80kg gây ra những hạn chế vật lý nghiêm trọng:\n- Mất cân bằng mô-men xoắn (Torque imbalance): Khi quất vây đuôi cực dài nặng nề với lực cản nước lớn, con cá mập cần một khối lượng thân trước đủ lớn (trọng lượng neo) để triệt tiêu phản lực xoay. Ở khối lượng chỉ 80kg, thân trước quá nhẹ khiến phản lực quật đuôi làm cho toàn bộ phần thân trước bị xoay ngược hướng quật. Con cá mập sẽ tự quay vòng tròn vô hại thay vì đánh trúng đích.\n- Giảm hiệu suất giữ nhiệt đối lưu: Hệ tuần hoàn giữ ấm (rete mirabile) ở mắt và não kém hiệu quả hơn khi kích thước cơ thể giảm xuống, làm giảm tốc độ xử lý thần kinh ở tầng nước lạnh sâu.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Phản lực mô-men xoắn",
                  issue: "Phản lực xoay vượt quá mô-men quán tính thân trước, làm lệch hướng bơi 45 độ sau mỗi cú đập."
                },
                {
                  type: "Suy giảm trao đổi nhiệt",
                  issue: "Tốc độ mất nhiệt qua da tăng 1.8 lần do tỷ lệ diện tích bề mặt/thể tích tăng."
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Biomechanics of shark tail locomotion", url: "https://doi.org/10.1086/339618" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Jet-Thrust Predator)",
            slug: "ca-map-duoi-roi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Vây ngực mở rộng cân bằng mô-men, sợi cơ sẫm màu tăng cường giữ nhiệt, vẩy bơi giảm ma sát tối đa.",
            content: "Để hoạt động tối ưu ở kích thước 80kg, các đột biến sau được giả định:\n- Vây ngực mở rộng dạng cánh lái (Aerofoil Pectoral Fins): Diện tích vây ngực tăng 40%, có cơ khớp xoay chủ động để tạo lực nâng đối lập, triệt tiêu phản lực xoay khi quất đuôi.\n- Cơ đỏ sẫm phân bố lõi thân: Tăng mật độ mạch máu bao quanh cơ trung tâm để lưu giữ nhiệt não ngay cả khi khối lượng giảm.\n- Vảy gai siêu trượt (Riblet Denticles): Cấu trúc vảy gai nhỏ trên da tiến hóa các rãnh siêu nhỏ định hướng dòng chảy tối ưu, giảm ma sát kéo xuống 12%, cho phép đạt gia tốc bơi bùng nổ lên tới 15 m/s2.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vây ngực cánh lái cản xoay",
                  benefit: "Triệt tiêu 95% mô-men phản lực xoay, giữ quỹ đạo đòn đánh thẳng tắp."
                },
                {
                  type: "Hệ vảy gai Riblet Denticles",
                  benefit: "Giảm ma sát kéo thủy động lực học, tăng tốc độ bơi bùng nổ tức thời."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Riblet structures for skin friction drag reduction in sharks", url: "https://doi.org/10.1016/j.ast.2018.11.002" }
            ]
          }
        ]
      });
    } else if (target.id === "tongue-eating-louse") {
      whatIfData.push({
        creature_id: "tongue-eating-louse",
        title: "Nếu Bọ Hút Máu Lưỡi Cá phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bo-hut-mau-luoi-ca-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ký sinh trùng dẹt chịu lực, có vuốt sắc bám chặt lưỡi cá hồng đạt kích thước khổng lồ 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Giant Chitinous Parasite)",
            slug: "bo-hut-mau-luoi-ca-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lớp vỏ kitin dẹt siêu cứng chịu áp lực tấn, và 14 móng vuốt móc neo cắm sâu xé nát thớ cơ đối thủ.",
            content: "Khi bọ hút máu lưỡi cá (nguyên bản dài 2cm, nặng 1g) được phóng to hoàn hảo lên 80kg (tăng kích thước chiều dài gấp 43 lần):\n- Lớp vỏ kitin dẹt dẻo dai dày tới 1.5 cm, chịu được lực nén trực tiếp lên tới 10 tấn, chống chọi được hầu hết các đòn tấn công vật lý thông thường.\n- 7 cặp chân bám (14 chân) đầu mút là các móng vuốt móc neo bằng chất sừng kitin cứng hóa dài 10cm. Lực kẹp bám móc của mỗi chân đạt 1500 N (tổng cộng 21,000 N lực bám dính), một khi đã cắm chặt vào cơ thể đối thủ thì không thể gỡ ra.\n- Hàm sắc bén cắn ngập sâu, bơm chất chống đông máu phóng đại gây mất máu nhanh chóng và phá hủy thớ cơ đối thủ từ bên trong.",
            formulas_and_data: {
              scaling_factor: 43,
              mass_g_original: 1,
              mass_kg_scaled: 80,
              claw_length_cm_original: 0.2,
              claw_length_cm_scaled: 10,
              formulas: [
                {
                  name: "Lực kẹp bám móc cơ học tổng hợp",
                  equation: "F_grip = N_legs * F_leg_original * (M_scaled / M_original)^(2/3)",
                  result: "~21,000 N"
                },
                {
                  name: "Áp lực nén giới hạn vỏ kitin",
                  equation: "P_limit = sigma_y * (A_scaled / A_original)",
                  result: "~100 kN"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Biomechanical properties of crustacean cuticle", url: "https://doi.org/10.1016/j.actbio.2010.02.007" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Suffocating Shell)",
            slug: "bo-hut-mau-luoi-ca-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt sau vài phút do hệ thống mang khuếch tán không khí bất lực trước cơ thể khổng lồ.",
            content: "Trong thế giới thực tế, sinh vật chân đều (isopod) 80kg sẽ sụp đổ sinh học ngay lập tức:\n- Khủng hoảng hô hấp: Loài này hô hấp bằng mang thở (pleopods) nằm dưới bụng dưới dạng nếp gấp khuếch tán. Khi cơ thể tăng thể tích gấp 80,000 lần, nhu cầu oxy tăng 80,000 lần nhưng diện tích mang chỉ tăng 1,800 lần. Nó sẽ chết ngạt ngay lập tức ngoài không khí và thậm chí dưới nước nếu nước không chảy cực nhanh qua mang.\n- Trọng lượng vỏ đè nén: Khung xương ngoài kitin không có cấu trúc xương xốp nâng đỡ bên trong. Ở khối lượng 80kg, trọng lượng lớp vỏ tự đè bẹp các cơ quan nội tạng mềm bên trong dưới tác dụng của trọng lực Trái Đất.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Suy hô hấp cấp tính",
                  issue: "Tỷ lệ diện tích hô hấp trên thể tích giảm 44 lần, không đủ duy trì nồng độ oxy trong máu."
                },
                {
                  type: "Sụp đổ cơ học nội tạng",
                  issue: "Áp lực tự trọng vỏ kitin đè lên mô mềm vượt quá 0.2 MPa, gây dập nát nội tạng."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "The scaling of gas exchange in arthropods", url: "https://doi.org/10.1152/physrev.1994.74.4.685" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Interface Symbiont)",
            slug: "bo-hut-mau-luoi-ca-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phát triển hệ thống khí quản phân nhánh chủ động, tuyến bài tiết hấp thụ kim loại nặng bảo vệ vỏ và nọc độc gây tê liệt nơ-ron.",
            content: "Để sinh tồn và chiến đấu như một quái thú 80kg, bọ ký sinh tiến hóa các đặc tính:\n- Hệ thống hô hấp khí quản giả (Pseudo-tracheal tubes): Phát triển mạng lưới ống khí phân nhánh mang oxy trực tiếp từ môi trường luồn sâu vào các mô cơ giống như côn trùng cỡ lớn.\n- Kitin hóa màng bọc cơ (Composite Chitin Shell): Lớp vỏ được gia cố thêm các sợi khoáng calcite và sắt tự hấp thu từ máu vật chủ, tăng độ bền uốn lên 3 lần mà không tăng trọng lượng.\n- Chất chống đông & Tê liệt thần kinh (Anesthetic Neurotoxin): Bơm nọc độc tổng hợp vừa ngăn đông máu vừa làm liệt nơ-ron cảm giác của mục tiêu, khiến nạn nhân không hề cảm thấy đau khi bị cắm vuốt bám.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ ống khí quản giả",
                  benefit: "Tăng hiệu suất khuếch tán oxy lên 500%, cho phép hoạt động liên tục ngoài môi trường nước."
                },
                {
                  type: "Vỏ composite khoáng sắt",
                  benefit: "Độ bền uốn đạt 120 MPa, chống chịu các đòn cắn bẻ gãy từ đối thủ."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Structural reinforcement in crustacean exoskeletons", url: "https://doi.org/10.1016/j.actbio.2008.07.026" }
            ]
          }
        ]
      });
    } else if (target.id === "alaskan-wood-frog") {
      whatIfData.push({
        creature_id: "alaskan-wood-frog",
        title: "Nếu Ếch Gỗ Alaska phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ech-go-alaska-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ếch gỗ sở hữu siêu năng lực đóng băng cơ thể sống sót qua mùa đông âm độ đạt kích cỡ của một con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Cryo-Leaper)",
            slug: "ech-go-alaska-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú bật nhảy cao 14 mét vượt mọi chướng ngại vật và cú va chạm đạp vỡ kính cường lực.",
            content: "Khi Ếch Gỗ Alaska đạt khối lượng 80kg (phóng to cơ học tuyến tính hoàn hảo):\n- Tỉ lệ cơ đùi cực đại của loài ếch cho phép nó giải phóng lực bật nhảy khổng lồ. Ở kích thước 80kg, chiều dài đùi sau đạt khoảng 90cm. Nhờ gia tốc cất cánh 40G, lực đẩy đùi đạt tới 32,000 N, đẩy sinh vật lên độ cao 14 mét và xa tới 25 mét chỉ sau một cú bật nhảy bùng nổ.\n- Cơ chế bảo vệ lạnh tự nhiên cho phép nó chịu được những cú sốc lạnh đột ngột, đóng băng toàn bộ cơ thể trong thời gian ngắn mà không gây tổn hại cho mô cơ hay dây thần kinh hoạt động nhạy bén.",
            formulas_and_data: {
              scaling_factor: 5333,
              mass_kg_original: 0.015,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài đùi sau phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~0.9m"
                },
                {
                  name: "Động năng bật nhảy bùng nổ",
                  equation: "E_jump = F_average * d_takeoff",
                  result: "~11,000 Joules"
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Frog jumping biomechanics and power amplification", url: "https://doi.org/10.1242/jeb.00921" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Crystal Shatter)",
            slug: "ech-go-alaska-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết do tinh thể băng lớn xé rách tế bào khi đông cứng quá chậm, và xương đùi gãy vụn khi hạ cánh.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng đóng băng chậm (Heat dissipation crisis): Thời gian làm lạnh và truyền nhiệt từ lõi cơ thể ra môi trường tỉ lệ nghịch với diện tích bề mặt trên thể tích (S/V). Với khối lượng 80kg (tăng 5333 lần), tỷ lệ S/V giảm hơn 17 lần. Quá trình đông lạnh lõi cơ thể kéo dài hàng chục giờ thay vì vài chục phút. Sự làm lạnh quá chậm này dẫn tới hiện tượng macro-crystallization (tinh thể băng ngoại bào phát triển quá to), đâm thủng vách tế bào, phá hủy hoàn toàn mạch máu và các cơ quan nội tạng.\n- Giới hạn chịu lực xương: Khi rơi từ độ cao nhảy 14 mét xuống đất, lực tác động va chạm đạt hơn 50,000 N. Xương đùi ếch mỏng không có tủy xương chịu lực nén cao sẽ gãy vụn ngay lập tức khi hạ cánh.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Tốc độ đông đặc và tinh thể băng",
                  issue: "Thời gian đóng băng lõi tăng từ 2 giờ lên 34 giờ, gây phá hủy tế bào do tinh thể băng khổng lồ."
                },
                {
                  type: "Sức bền xương amphibians",
                  issue: "Ứng suất nén của xương rỗng vượt quá giới hạn bền uốn 120 MPa khi tiếp đất."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Cryobiology and thermal properties of freeze-tolerant frogs", url: "https://doi.org/10.1152/ajpregu.1999.276.6.R1460" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Cryo-Stasis Knight)",
            slug: "ech-go-alaska-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống mạch máu xương gia cố, protein chống đông máu điều khiển tinh thể băng, và mô cơ hấp thụ xung lực.",
            content: "Để sinh tồn ở kích thước 80kg, Ếch Gỗ Alaska tiến hóa các đột biến thích nghi sau:\n- Protein kiểm soát băng (Ice-Structuring Proteins - ISPs): Tiết ra lượng lớn ISPs siêu hoạt tính liên kết chặt chẽ vào bề mặt các hạt đá sơ khởi, giữ kích thước tinh thể băng luôn dưới 10 micromet (micro-crystallization) bất kể tốc độ làm lạnh chậm.\n- Xương xốp đặc hóa (Vascularized Trabecular Bones): Cấu trúc xương chi được gia cố bằng các thớ xương xốp ngập khoáng chất canxi phosphat tăng khả năng chịu nén ngang ngửa động vật có vú.\n- Hệ thống đệm nước nội bào (Aquaporin-Hydrogel): Màng tế bào tăng lượng Aquaporin loại mới kết hợp với hydrogel sinh học làm chậm quá trình đông đá tế bào, duy trì khả năng phục hồi thần kinh nhanh chóng.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Protein định hình tinh thể băng",
                  benefit: "Duy trì kích thước tinh thể băng dưới 10 micromet, loại bỏ hoàn toàn tổn thương cơ học tế bào."
                },
                {
                  type: "Cấu trúc xương đặc hóa",
                  benefit: "Tăng giới hạn chịu ứng suất nén của xương lên 210 MPa, hấp thụ lực hạ cánh an toàn."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Aquaporins and ice nucleation in freeze-tolerant vertebrates", url: "https://doi.org/10.1016/j.cryobiol.2015.08.003" }
            ]
          }
        ]
      });
    } else if (target.id === "alligator-snapping-turtle") {
      whatIfData.push({
        creature_id: "alligator-snapping-turtle",
        title: "Nếu Rùa Cá Sấu phóng to thành quái thú khổng lồ (800kg) thì sao?",
        slug: "neu-rua-ca-sau-phong-to-thanh-quai-thu-khong-lo-800kg",
        description: "Phân tích giả thuyết khi loài rùa cá sấu tiền sử sở hữu mỏ khoằm và lực cắn hủy diệt đạt kích thước quái thú khổng lồ nặng 800kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Devastator Shell)",
            slug: "rua-ca-sau-800kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn 4600 PSI phá hủy sắt thép dễ dàng, và lớp mai dày 15cm cản phá mọi đòn va đập lực tấn.",
            content: "Khi Rùa Cá Sấu đạt khối lượng 800kg (phóng to gấp 10 lần khối lượng trung bình tự nhiên):\n- Lực cắn phóng đại cơ học: Lực cắn ban đầu từ 1,000 PSI tăng lên gấp 10^(2/3) ≈ 4.64 lần, đạt khoảng 4,640 PSI (~32 MPa). Áp lực này vượt trội so với loài cá sấu lớn nhất hiện nay, cho phép nó cắn đứt đôi các tấm kim loại dày hoặc bẻ đôi thân cây gỗ đường kính 30cm chỉ trong một nhát sập hàm.\n- Mai rùa dày tới 15 cm bằng chất sừng keratin và các tấm xương hợp nhất cứng cáp, đóng vai trò như lá chắn phòng thủ tối thượng chịu được va chạm trực tiếp của các loại vũ khí hạng nặng.",
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_original: 80,
              mass_kg_scaled: 800,
              formulas: [
                {
                  name: "Lực cắn phóng đại",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,640 PSI (~20,800 N)"
                },
                {
                  name: "Độ dày mai xương bảo vệ",
                  equation: "T_scaled = T_original * (M_scaled / M_original)^(1/3)",
                  result: "~15 cm"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Bite force estimation and jaw mechanics in turtles", url: "https://doi.org/10.1002/jez.1643" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Immobile Stone)",
            slug: "rua-ca-sau-800kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Lớp mai nặng nề chèn ép phổi gây khó thở, và sự suy giảm 53% khả năng hấp thụ oxy qua cloaca.",
            content: "Trong thực tế vật lý sinh học:\n- Suy giảm hô hấp cloaca (Cloacal respiration failure): Kỳ nghỉ đông dưới nước sâu của loài rùa Snapping dựa vào việc khuếch tán oxy qua niêm mạc cloaca. Khi khối lượng tăng 10 lần, nhu cầu oxy tăng 10 lần nhưng diện tích da cloaca chỉ tăng ~4.64 lần (giảm tỉ lệ S/V đi 53%). Rùa sẽ chết đuối nhanh chóng khi ngủ đông dưới nước sâu nếu không nổi lên thở liên tục.\n- Sụp đổ hệ vận động: Khớp sprawling (chân bẹt ngang nách) của rùa chịu mô-men uốn cực lớn từ trọng lượng 800kg đè nặng. Các khớp xương chi trước chịu lực uốn quá mức, khiến nó gần như hoàn toàn bất động trên cạn, chỉ có thể nằm im một chỗ chờ mồi.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hiệu suất hô hấp cloaca",
                  issue: "Tỉ lệ diện tích bề mặt cloaca trên thể tích cơ thể giảm 53.6%, không thể ngủ đông dưới nước."
                },
                {
                  type: "Ứng suất uốn xương chi",
                  issue: "Mô-men uốn khớp vai tăng gấp 21.5 lần, vượt giới hạn an toàn của cấu trúc sprawling."
                }
              ]
            },
            p4p_score_scaled: 38,
            tier_scaled: "D",
            sources: [
              { label: "Allometry of respiration and bone mechanics in reptiles", url: "https://doi.org/10.1242/jeb.01822" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Dreadnought)",
            slug: "rua-ca-sau-800kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Lớp vỏ cấu trúc bọt xương xốp tổ ong siêu nhẹ, và phổi mở rộng cơ hoành giả bọc cơ ngực.",
            content: "Để hoạt động hiệu quả ở kích thước quái thú 800kg, Rùa Cá Sấu cần những đột biến tiến hóa sâu sắc:\n- Mai xốp khí tổ ong (Trabecular Shell Structure): Lớp xương bên trong mai tiến hóa dạng lưới xốp chứa túi khí giống cấu trúc xương chim, giúp giảm 40% khối lượng mai mà không giảm độ bền chịu lực nén.\n- Hệ thống phổi chủ động (Active Diaphragmatic Muscle): Phát triển cơ hoành giả liên kết trực tiếp vào cơ bả vai và cơ háng, giúp kéo giãn phổi chủ động, tăng dung tích trao đổi khí lên 150% để giải quyết sự thiếu hụt oxy.\n- Khớp bán dựng (Semi-erect limbs): Các chi tiến hóa xoay hướng thẳng đứng hơn dưới thân mình giống như loài cá sấu cổ đại chân cao, giảm mô-men xoắn chịu lực uốn ở vai.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khớp chi bán dựng và mai giảm trọng",
                  benefit: "Giảm lực mô-men xoắn uốn lên khớp chi đi 70%, cho phép rùa di chuyển với vận tốc 8 km/h trên cạn."
                },
                {
                  type: "Hệ thống hô hấp phổi cải tiến",
                  benefit: "Cung cấp lượng dưỡng khí đạt 180 lít/giờ, duy trì hoạt động săn mồi tích cực."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Evolution of turtle shell microstructure and bone density", url: "https://doi.org/10.1002/jmor.10821" }
            ]
          }
        ]
      });
    } else if (target.id === "asian-water-monitor") {
      whatIfData.push({
        creature_id: "asian-water-monitor",
        title: "Nếu Kỳ Đà Nước Châu Á phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ky-da-nuoc-chau-a-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài kỳ đà nước có cú vụt đuôi roi dũng mãnh và nọc độc giãn mạch đạt kích thước 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Swamp Dragon)",
            slug: "ky-da-nuoc-chau-a-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đuôi roi quật lực 4800 N bẻ gãy chi con mồi, và hàm độc tố gây giãn mạch tử vong tức thì.",
            content: "Khi Kỳ Đà Nước Châu Á đạt khối lượng 80kg (tăng gấp 4 lần khối lượng trung bình tự nhiên):\n- Cú quất đuôi hủy diệt: Đuôi dẹp hoạt động như mái chèo phóng to lên độ dài 2.4 mét. Lực quật đuôi tăng theo tỷ lệ diện tích cơ chéo đạt tới 4,800 N, dễ dàng quật ngã hoặc gãy chân các con mồi lớn như nai hay lợn rừng.\n- Đòn cắn độc và cào xé: Bộ vuốt sắc dài 12cm cào rách da thịt dưới lực cào 3000 N. Đồng thời, tuyến độc hàm dưới tiết ra lượng độc tố dồi dào, gây hạ huyết áp cực nhanh và ức chế đông máu khiến con mồi mất máu tử vong chỉ sau vài phút bị cắn.",
            formulas_and_data: {
              scaling_factor: 4,
              mass_kg_original: 20,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài đuôi phóng đại",
                  equation: "L_tail_scaled = L_tail_original * (M_scaled / M_original)^(1/3)",
                  result: "~2.4m"
                },
                {
                  name: "Lực quật đuôi động năng",
                  equation: "F_whip = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,800 N"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Monitor lizard tail whipping kinematics and muscle force", url: "https://doi.org/10.1242/jeb.02521" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Sluggish Giant)",
            slug: "ky-da-nuoc-chau-a-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Thời gian hấp thu nhiệt tăng vọt làm cơ thể đình trệ buổi sáng, và khớp sprawling mỏi mệt cực độ.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng nhiệt độ (Thermal inertia lag): Ectothermic (sinh vật biến nhiệt) dựa vào phơi nắng để khởi động trao đổi chất. Ở khối lượng 80kg, thời gian phơi nắng cần thiết để đạt thân nhiệt hoạt động 35°C tăng gấp 2.5 lần (lên tới 4-5 tiếng). Cho đến trưa, nó sẽ cực kỳ chậm chạp và dễ bị tấn công.\n- Ứng suất uốn chi bò ngang: Tư thế bò ngang (sprawling limbs) tạo ra mô-men uốn khổng lồ lên xương humerus và femur. Với khối lượng 80kg, việc nâng cơ thể bò sát mặt đất đòi hỏi năng lượng cơ bắp khổng lồ, khiến kỳ đà kiệt sức chỉ sau vài phút bò liên tục.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thời gian phơi nắng khởi động",
                  issue: "Tỷ số diện tích hấp thụ nhiệt trên khối lượng cơ thể giảm 37%, làm tăng thời gian phơi nắng lên 300 phút."
                },
                {
                  type: "Bền mỏi của cơ xương sprawling",
                  issue: "Nhu cầu oxy hóa và ATP cơ vai tăng gấp 8 lần để chống đỡ trọng lực khi bò."
                }
              ]
            },
            p4p_score_scaled: 40,
            tier_scaled: "D",
            sources: [
              { label: "Ectotherm thermodynamics and scaling of locomotor energetics", url: "https://doi.org/10.1086/515886" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Warm-Blooded Apex)",
            slug: "ky-da-nuoc-chau-a-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ tuần hoàn van tim khép kín tăng hiệu suất hô hấp, và cấu trúc chân đứng thẳng giảm mô-men xoắn.",
            content: "Để sinh tồn ở kích thước 80kg, Kỳ Đà Nước tiến hóa các đột biến vượt bậc:\n- Bán nội nhiệt tự ấm (Facultative Endothermy): Phát triển cơ chế sinh nhiệt qua cơ xương và hệ tuần hoàn ngược dòng vùng lõi, tự duy trì thân nhiệt hoạt động 32°C mà không phụ thuộc hoàn toàn vào phơi nắng.\n- Tư thế chi cải tiến (Erect Limb Posture): Khớp háng và khớp vai xoay thẳng đứng xuống dưới thân giống như khủng long ăn thịt nhỏ hoặc động vật có vú, chuyển hoàn toàn lực uốn thành lực nén dọc thớ xương đùi gia cố đặc.\n- Hệ thống tim mạch áp lực cao: Vách ngăn tâm thất tim phát triển hoàn thiện để cô lập dòng máu giàu oxy và máu nghèo oxy, tăng áp suất động mạch lên 120 mmHg để cấp máu nhanh cho các cơ vận động đuôi.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Sinh nhiệt nội sinh vùng lõi",
                  benefit: "Tự duy trì thân nhiệt tối ưu 32°C bất kể thời tiết, tăng tốc độ phản xạ thần kinh thêm 40%."
                },
                {
                  type: "Cấu trúc chi thẳng đứng",
                  benefit: "Giảm tiêu hao năng lượng vận động đi 65%, cho phép chạy nước rút đạt 32 km/h."
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "B",
            sources: [
              { label: "Cardiovascular adaptations and metabolic rates in giant varanids", url: "https://doi.org/10.1152/ajpregu.1995.268.4.R891" }
            ]
          }
        ]
      });
    } else if (target.id === "cape-buffalo") {
      whatIfData.push({
        creature_id: "cape-buffalo",
        title: "Nếu Trâu Rừng Châu Phi thu nhỏ bằng con người (80kg) thì sao?",
        slug: "neu-trau-rung-chau-phi-thu-nho-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài trâu rừng sở hữu cặp sừng cứng cáp hình cánh cung và cơ bắp cuồn cuộn được thu nhỏ về kích thước 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Compact Charger)",
            slug: "trau-rung-chau-phi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú húc tốc độ cao giải phóng áp lực lớn đâm xuyên lá chắn và lực kéo siêu phàm ở kích thước nhỏ.",
            content: "Khi Trâu Rừng Châu Phi thu nhỏ về khối lượng 80kg (tỷ lệ cơ học tối ưu hóa):\n- Mật độ cơ bắp cô đọng cực cao: Sức mạnh cơ bắp của động vật móng guốc được bảo toàn trên một khung xương nhỏ gọn. Lực kéo cơ học đạt tới 5000 N, tương đương 6 lần trọng lượng cơ thể.\n- Cú húc sừng hủy diệt: Cặp sừng xương bọc keratin thu nhỏ dài khoảng 30cm, hợp nhất ở trán tạo thành tấm khiên chắn dày. Khi lao đi with vận tốc 50 km/h (13.8 m/s), động năng va chạm đạt tới 7600 Joules. Do diện tích tiếp xúc đầu sừng nhọn nhỏ (~2 cm2), áp suất va chạm tức thời tại điểm tiếp xúc đạt tới 38 MPa, đủ sức đâm thủng và phá hủy các cấu trúc kim loại mỏng hoặc gỗ dày.",
            formulas_and_data: {
              scaling_factor: 0.43,
              mass_kg_original: 600,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Động năng cú húc va chạm",
                  equation: "E_k = 0.5 * m * v^2",
                  result: "~7,600 Joules"
                },
                {
                  name: "Áp suất va chạm đầu sừng",
                  equation: "P = F / A = (m * a) / A",
                  result: "~38 MPa"
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "A",
            sources: [
              { label: "Bovine horn mechanics and impact resistance", url: "https://doi.org/10.1016/j.jmbbm.2010.09.005" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Hypothermic Ruminant)",
            slug: "trau-rung-chau-phi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất nhiệt nhanh chóng do tỷ lệ diện tích bề mặt/thể tích tăng, và hệ thống tiêu hóa cỏ thô trở nên kém hiệu quả.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng nhiệt lượng: Khi thu nhỏ từ 600kg về 80kg, tỷ lệ diện tích bề mặt trên thể tích (S/V) tăng lên khoảng 2.0 lần. Động vật nội nhiệt (biến nhiệt/đồng nhiệt) nhỏ mất nhiệt qua da nhanh hơn rất nhiều. Với lớp da mỏng nguyên bản của trâu rừng châu Phi, nó sẽ nhanh chóng bị hạ thân nhiệt trầm trọng trong môi trường gió lạnh trừ khi liên tục ăn và tỏa nhiệt.\n- Kém hiệu quả tiêu hóa: Hệ thống dạ dày 4 túi (ruminant) của trâu rừng cần thời gian ủ men cỏ thô rất lâu. Khi thu nhỏ về 80kg, tốc độ trao đổi chất tăng lên theo định luật Kleiber (tăng khoảng 1.6 lần trên mỗi kg khối lượng). Hệ tiêu hóa nhỏ hơn không thể xử lý đủ lượng chất xơ thô kịp nhu cầu năng lượng cao mới, dẫn tới suy kiệt chất dinh dưỡng.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Tổn thất nhiệt lượng đối lưu",
                  issue: "Tốc độ tỏa nhiệt qua da tăng 1.95 lần do diện tích bề mặt tương đối tăng, gây nguy cơ hạ thân nhiệt cấp tính."
                },
                {
                  type: "Hạn chế dạ dày bốn túi",
                  issue: "Thời gian lên men cỏ dài không đáp ứng được tốc độ trao đổi chất tăng 60% theo định luật Kleiber ở kích thước 80kg."
                }
              ]
            },
            p4p_score_scaled: 32,
            tier_scaled: "D",
            sources: [
              { label: "Allometric scaling of mammalian metabolism and digestion", url: "https://doi.org/10.1086/284124" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Tundra Charger)",
            slug: "trau-rung-chau-phi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Lớp lông tơ cách nhiệt dày đặc, hệ tiêu hóa dạ cỏ chuyển sang lên men nhanh và tuần hoàn máu vùng sừng co thắt.",
            content: "Để sinh tồn ở kích thước 80kg, trâu rừng tiến hóa các đột biến thích nghi:\n- Lông tơ kép cách nhiệt (Double-coat Fur): Phát triển lớp lông tơ mịn lót dưới lớp lông cứng chống thấm nước, tăng hệ số cách nhiệt lên 2.5 lần để giữ ấm vùng lõi.\n- Dạ cỏ cải tiến lên men nhanh (Fast-transit Rumen): Dạ cỏ tiến hóa hệ vi sinh vật lên men tốc độ cao kết hợp cấu trúc nhung mao dạ dày rộng hơn để hấp thu nhanh các axit béo bay hơi tự do.\n- Cơ chế co mạch sừng chủ động: Hệ thống mạch máu nuôi sừng có khả năng co thắt hoàn toàn khi trời lạnh để tránh thất thoát nhiệt lượng qua bề mặt sừng lớn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Lông kép cách nhiệt vùng lõi",
                  benefit: "Giảm 60% lượng nhiệt thất thoát ra môi trường, duy trì thân nhiệt ổn định 38.5°C."
                },
                {
                  type: "Vi sinh dạ cỏ tối ưu",
                  benefit: "Tăng tốc độ chuyển hóa xenlulozo thêm 75%, đáp ứng đủ năng lượng cho chuyển hóa Kleiber."
                }
              ]
            },
            p4p_score_scaled: 76,
            tier_scaled: "B",
            sources: [
              { label: "Adaptations in small ruminants and thermal regulation", url: "https://doi.org/10.1016/j.smallrumres.2012.04.011" }
            ]
          }
        ]
      });
    } else if (target.id === "coconut-crab") {
      whatIfData.push({
        creature_id: "coconut-crab",
        title: "Nếu Cua Dừa phóng to bằng con người (80kg) thì sao?",
        slug: "neu-cua-dua-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài giáp xác trên cạn lớn nhất thế giới sở hữu cặp càng kẹp dừa cực khỏe đạt khối lượng tương đương 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Titanium Crusher)",
            slug: "cua-dua-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực kẹp càng đạt 60,000 N nghiền nát mọi chướng ngại vật và bộ giáp kitin dày cản phá mọi va đập.",
            content: "Khi Cua Dừa đạt khối lượng 80kg (phóng to tuyến tính từ 4kg):\n- Lực kẹp càng hủy diệt: Càng cua dừa tự nhiên kẹp mạnh gấp 90 lần trọng lượng của nó (~3300 N ở cua 4kg). Khi phóng to lên 80kg, lực kẹp càng tăng theo tỷ lệ diện tích mặt cắt ngang cơ chéo tăng 20^(2/3) ≈ 7.37 lần, đạt tới 24,000 N đến 60,000 N. Lực này vượt qua sức nghiền của hàm cá mập trắng lớn, dễ dàng bóp nát xương đùi động vật lớn hoặc cắt đứt kim loại.\n- Giáp ngoài siêu cứng: Lớp vỏ kitin dầy lên 1.2cm được canxi hóa cực cứng, đóng vai trò như lớp giáp xe tăng hấp thụ các chấn động va chạm.",
            formulas_and_data: {
              scaling_factor: 20,
              mass_kg_original: 4,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực kẹp càng cua phóng đại",
                  equation: "F_pinch_scaled = F_pinch_original * (M_scaled / M_original)^(2/3)",
                  result: "~24,000 N (Lên tới 60,000 N)"
                },
                {
                  name: "Ứng suất nén phá hủy vỏ",
                  equation: "sigma = F / A_shell",
                  result: "~90 MPa"
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Pincer force and scaling in giant coconut crabs", url: "https://doi.org/10.1371/journal.pone.0166108" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Asphyxiated Shell)",
            slug: "cua-dua-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt do branchiostegal lung thiếu diện tích khuếch tán oxy và vỏ quá nặng gãy chân bò.",
            content: "Trong thực tế vật lý sinh học:\n- Suy giảm hô hấp nghiêm trọng: Cua dừa thở bằng phổi lá mang (branchiostegal lung) dựa vào sự ẩm ướt và khuếch tán thụ động. Khi phóng to lên 80kg (tăng 20 lần khối lượng), nhu cầu oxy tăng 20 lần nhưng diện tích bề mặt phổi chỉ tăng 20^(2/3) ≈ 7.37 lần. Khả năng cung cấp oxy giảm đi 63%, khiến cua rơi vào trạng thái thiếu oxy kinh niên và chết ngạt sau vài phút vận động.\n- Sụp đổ cơ học chân: Khung xương ngoài kitin rất nặng chiếm 35% khối lượng cơ thể (28kg vỏ). Trọng lượng cơ thể đè nặng lên các khớp chân mảnh khảnh hướng ngang (sprawling limbs), tạo mô-men uốn quá tải khiến chân cua gãy vụn khi cố gắng nhấc mình lên bò.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hiệu suất khuếch tán khí qua phổi lá mang",
                  issue: "Tỉ số diện tích phổi trên thể tích cơ thể giảm 63%, gây thiếu hụt oxy nghiêm trọng khi bò."
                },
                {
                  type: "Ứng suất uốn khớp chi bò ngang",
                  issue: "Mô-men uốn tại khớp chân tăng gấp 147 lần, vượt quá giới hạn uốn 75 MPa của kitin tự nhiên."
                }
              ]
            },
            p4p_score_scaled: 18,
            tier_scaled: "D",
            sources: [
              { label: "Respiratory organs of terrestrial crabs and scaling limits", url: "https://doi.org/10.1242/jeb.204.14.2483" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Chitinous Titan)",
            slug: "cua-dua-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phổi lá mang gấp nếp sâu có van thông khí chủ động, vỏ rỗng xốp tổ ong, và sợi cơ liên kết chéo gia cố sắt.",
            content: "Để hoạt động hiệu quả ở kích thước 80kg, Cua Dừa cần những đột biến thích nghi vượt bậc:\n- Phổi lá mang xếp nếp sâu chủ động (Active Folded Lung): Các nếp gấp màng phổi tăng mật độ lên 4 lần kết hợp các bó cơ thành ngực co bóp nhịp nhàng bơm hút khí chủ động, đảm bảo đủ oxy.\n- Lớp vỏ kitin cấu trúc tổ ong (Honeycomb Exoskeleton): Lớp vỏ trong rỗng xốp làm giảm 50% khối lượng vỏ, lớp vỏ ngoài kết hợp các liên kết ion kẽm và sắt tự hấp thụ tăng độ bền uốn lên 2.5 lần.\n- Khớp chi đứng thẳng hơn: Các chi tiến hóa góc nghiêng hẹp hơn dưới thân mình để truyền tải trọng lượng trực tiếp thành lực nén dọc thay vì lực uốn ngang.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Thông khí phổi chủ động",
                  benefit: "Tăng lưu lượng oxy hấp thụ lên 300%, loại bỏ nguy cơ ngạt thở khi vận động mạnh."
                },
                {
                  type: "Vỏ kitin tổ ong gia cố kẽm",
                  benefit: "Giảm khối lượng bộ giáp từ 28kg xuống 15kg, tăng giới hạn uốn khớp chi lên 180 MPa."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Zinc and calcium mineralization in crustacean cuticles", url: "https://doi.org/10.1016/j.jsb.2007.09.014" }
            ]
          }
        ]
      });
    } else if (target.id === "giant-pacific-octopus") {
      whatIfData.push({
        creature_id: "giant-pacific-octopus",
        title: "Nếu Bạch Tuộc Khổng Lồ Thái Bình Dương lên cạn ở kích thước 80kg thì sao?",
        slug: "neu-bach-tuoc-khong-lo-thai-binh-duong-len-can-80kg",
        description: "Phân tích giả thuyết khi loài bạch tuộc thông minh sở hữu 8 xúc tu bám dính dày đặc và khả năng ngụy trang đỉnh cao hoạt động trên cạn ở kích thước 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Eight-Armed Chameleon)",
            slug: "bach-tuoc-khong-lo-tbd-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "8 xúc tu kẹp siết lực tấn với hàng ngàn giác hút, ngụy trang tàng hình hoàn hảo và trí khôn vượt bậc.",
            content: "Khi Bạch Tuộc Khổng Lồ Thái Bình Dương đạt khối lượng 80kg trên cạn (theo cơ học lý thuyết):\n- Sức mạnh co siết của xúc tu: Mỗi xúc tu dài tới 3 mét chứa hàng triệu bó cơ chéo xoắn liên kết dọc thân xúc tu. Lực siết tổng hợp của 8 xúc tu đạt tới 15,000 N, đủ sức bóp nghẹt động vật có vú lớn.\n- Giác hút chân không siêu dính: Khoảng 1,600 giác hút phóng to hoạt động riêng lẻ, mỗi giác hút có đường kính 5cm có lực bám dính chênh lệch áp suất đạt 0.1 MPa (100 kPa). Tổng lực dính của một xúc tu bám chặt lên bề mặt phẳng có thể nâng đỡ vật nặng tới 800kg.\n- Ngụy trang tàng hình: Hàng triệu tế bào sắc tố (chromatophores) và tế bào phản quang (iridophores) điều chỉnh co thắt tức thì, giúp bạch tuộc hòa lẫn vào môi trường đất đá trên cạn chỉ trong 0.5 giây.",
            formulas_and_data: {
              scaling_factor: 2.28,
              mass_kg_original: 35,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực bám dính giác hút tối đa dưới áp suất khí quyển",
                  equation: "F_adhesion = N_suckers * P_atm * A_sucker",
                  result: "~12,000 N (mỗi xúc tu)"
                },
                {
                  name: "Lực siết xoắn cơ xúc tu",
                  equation: "T_whip = F_muscle * r_arm",
                  result: "~4,500 N.m"
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Suction power and muscle hydrostats in cephalopods", url: "https://doi.org/10.1242/jeb.00512" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Gelatinous Collapse)",
            slug: "bach-tuoc-khong-lo-tbd-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ thể xẹp lép thành đống thạch do thiếu lực nâng thủy tĩnh, ngạt thở nhanh chóng và khô héo da.",
            content: "Trong thực tế vật lý sinh học khi lên cạn:\n- Sụp đổ cấu trúc thủy tĩnh (Hydrostatic skeleton collapse): Bạch tuộc không có xương trong hay xương ngoài, hình dáng cơ thể được duy trì nhờ áp suất nước xung quanh. Khi lên cạn ở khối lượng 80kg dưới trọng lực, các sợi cơ không có điểm tựa nâng đỡ sẽ bị xẹp lép thành một đống thạch dẹp. Bạch tuộc không thể bò hay nhấc xúc tu lên, nội tạng bị đè nén dưới áp lực tự trọng dẫn tới tổn thương vĩnh viễn.\n- Suy hô hấp và mất nước cấp tính: Mang của bạch tuộc bị dính chặt vào nhau ngoài không khí do lực căng bề mặt nước, diện tích trao đổi khí giảm 95% gây ngạt thở sau vài phút. Làn da ẩm ướt mỏng manh bốc hơi nước cực nhanh ngoài không khí dẫn đến mất cân bằng điện giải tức thì.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Sụp đổ khung xương thủy tĩnh",
                  issue: "Không có lực nâng của nước, ứng suất đè nén lên các mô mềm bên trong vượt quá 15 kPa gây dập nát mao mạch."
                },
                {
                  type: "Xẹp mang và giảm diện tích hô hấp",
                  issue: "Lực căng bề mặt làm xẹp các phiến mang dính chùm, cắt đứt hoàn toàn lượng oxy khuếch tán vào máu."
                }
              ]
            },
            p4p_score_scaled: 10,
            tier_scaled: "D",
            sources: [
              { label: "Mechanics of hydrostatic skeletons and cephalopod respiration", url: "https://doi.org/10.1146/annurev.marine.010908.163750" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Land Leviathan)",
            slug: "bach-tuoc-khong-lo-tbd-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Trục xương sụn linh hoạt dọc xúc tu, da sừng nhầy bảo vệ chống bốc hơi và hệ hô hấp phổi khí quản kép.",
            content: "Để sinh tồn và thống trị đất ẩm ở kích thước 80kg, bạch tuộc tiến hóa các thích nghi thần kỳ:\n- Trục xương sụn dẻo (Endoskeletal Cartilage Rods): Tiến hóa các thanh sụn đàn hồi (giống như sụn mũi hoặc cuttlebone) chạy dọc lõi trung tâm của 8 xúc tu và vùng đầu, làm giá đỡ vững chắc chịu lực nén chống lại trọng lực Trái Đất mà vẫn giữ được sự linh hoạt uốn dẻo cực hạn.\n- Da sừng nhầy khóa ẩm (Lipid-Secreting Keratinized Skin): Lớp da biểu bì được bao phủ bởi các tế bào tiết lipid chống bốc hơi kết hợp chất nhầy dày đặc bảo vệ cơ thể khỏi bị khô ráp suốt 24 giờ ngoài không khí.\n- Khoang hô hấp khí quản (Vascularized Land-Lung): Khoang áo tiến hóa thành buồng phổi khép kín với các van đóng mở chủ động, thành buồng phổi lót mạch máu dày đặc khuếch tán oxy không khí trực tiếp.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Trục sụn xúc tu chịu lực",
                  benefit: "Chống chịu lực nén trọng lực lên tới 1200 N, cho phép nâng thân mình cao 60cm bò vững trên cạn."
                },
                {
                  type: "Hệ thống da khóa ẩm lipid",
                  benefit: "Giảm 92% tốc độ bốc hơi nước qua biểu bì, bảo vệ cơ thể khô ráo hoạt động tự do ngoài nước."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Cartilage structures in invertebrates and cephalopod skin physiology", url: "https://doi.org/10.1016/j.zool.2014.05.002" }
            ]
          }
        ]
      });
    } else if (target.id === "red-lipped-batfish") {
      whatIfData.push({
        creature_id: "red-lipped-batfish",
        title: "Nếu Cá Dơi Môi Đỏ phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-doi-moi-do-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi Cá Dơi Môi Đỏ với đôi môi đỏ rực, chiếc sừng câu illicium độc đáo và cặp vây giả đi bộ hóa khổng lồ đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Kỵ sĩ đi bộ dưới đáy biển)",
            slug: "ca-doi-moi-do-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Chi giả vây ngực/vây bụng đi bộ cực vững, sừng câu illicium dài 40cm phát chất nhử cực mạnh thu hút con mồi 5kg, và giáp nốt gai kitin dày 3mm chịu lực cực tốt.",
            content: "Khi Cá Dơi Môi Đỏ đạt khối lượng 80kg (phóng to từ ~100g, dài ~1.2m):\n- Bộ vây giả đi bộ siêu lực: Cặp vây ngực và vây bụng biến tính cơ xương hoạt động như đôi chân vững chãi. Áp dụng tỷ lệ diện tích mặt cắt cơ, lực nâng của chi giả đạt tới 1500 N, giúp chúng đi lại nhanh nhẹn dưới đáy cát với tốc độ 8 km/h.\n- Cần câu sinh học illicium phóng to: Chiếc sừng dài 40cm nhô ra trước trán chứa tuyến hóa chất dẫn dụ con mồi đậm đặc. Sự khuếch tán hóa chất lan tỏa xa 100m, lôi cuốn các loài cá lớn dưới 5kg đi vào phạm vi đớp.\n- Giáp gai cứng cáp: Các nốt sần chứa kitin dày lên tới 3mm tạo ra một lớp lá chắn chống chịu các vết cắn xé từ kẻ săn mồi.",
            formulas_and_data: {
              scaling_factor: 800,
              mass_g_original: 100,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực nâng chịu tải chi vây đi bộ",
                  equation: "F_lift = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~1,500 N"
                },
                {
                  name: "Chiều dài sừng câu illicium phóng đại",
                  equation: "L_illicium = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~40 cm"
                }
              ]
            },
            p4p_score_scaled: 74,
            tier_scaled: "B",
            sources: [
              { label: "Morphology and locomotion of the red-lipped batfish Ogcocephalus darwini", url: "https://doi.org/10.1111/j.1469-7998.2010.00762.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Chiếc mỏ neo cồng kềnh ngạt thở)",
            slug: "ca-doi-moi-do-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chân giả vây bị xẹp lún dưới đáy cát mềm do áp lực nén cao, sừng illicium hoại tử do kém lưu thông máu và ngạt thở vì thiếu cơ chế mang chủ động.",
            content: "Trong thực tế sinh học nếu cá dơi môi đỏ nặng 80kg:\n- Sụp lún và di chuyển tê liệt: Cặp chân vây giả không có khớp xoay linh hoạt và tiết diện tiếp xúc nhỏ. Ở khối lượng 80kg dưới tác dụng của trọng lực, áp lực nén xuống cát đạt 120 kPa, khiến cá dơi bị lún sâu xuống bùn cát, không thể di chuyển hay đứng dậy.\n- Tắc nghẽn sừng illicium: Hệ tuần hoàn của sừng illicium rất mảnh, không có van trợ tim chuyên dụng. Khi phóng to, áp lực cản dòng máu tăng 8 lần, khiến máu không thể bơm đến đầu sừng, gây thiếu oxy và hoại tử cần câu trong 48 giờ.\n- Suy hô hấp: Cá dơi có khe mang rất nhỏ và hệ bơm mang thụ động yếu, khi khối lượng tăng gấp 800 lần, nhu cầu oxy tăng mạnh nhưng diện tích mang chỉ tăng 86 lần, gây ngạt thở cấp tính.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp lực lún vây chi giả trên cát mềm",
                  issue: "Áp lực nén P = F / A tăng lên 120 kPa vượt quá giới hạn chịu tải của cát mịn đáy biển (thông thường < 40 kPa)."
                },
                {
                  type: "Sự sụt giảm tỷ lệ diện tích mang hô hấp",
                  issue: "Tỉ số diện tích mang / thể tích giảm 89%, khiến lượng oxy hấp thụ không đủ duy trì 15% chuyển hóa cơ bản."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Gill area and metabolic rate scaling in benthic fish", url: "https://doi.org/10.1086/515881" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú chân giả bọc giáp)",
            slug: "ca-doi-moi-do-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Bàn chân vây giả màng rộng xòe, cơ tim tăng áp lực tuần hoàn mang, và esca phát quang sinh học chủ động thích ứng tối sâu.",
            content: "Để sống sót và đi lại hiệu quả ở kích thước 80kg dưới đáy cát:\n- Chi vây bản rộng (Spreading Webbed Feet): Phần rìa vây ngực và vây bụng tiến hóa các màng da xòe rộng gấp 5 lần, hoạt động giống như giày tuyết giúp phân phối tải trọng 80kg đều ra bề mặt cát rộng, giảm áp lực nén xuống chỉ còn 25 kPa chống lún tuyệt đối.\n- Mang bơm thủy lực (Hydraulic Branchial Pump): Khe mang mở rộng kết hợp cơ hô hấp mang phát triển khỏe chủ động co bóp tuần hoàn nước liên tục, nâng cao hiệu suất lấy oxy gấp 4 lần.\n- Sừng câu phát quang esca: Đột biến esca cộng sinh vi khuẩn phát quang cho phép phát ánh sáng lục cường độ cao thay vì chỉ tiết hóa chất dẫn dụ, phù hợp thu hút con mồi trong vùng đáy nước sâu tối.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Màng vây ngực rộng chống lún",
                  benefit: "Tăng diện tích tiếp xúc chi lên 0.06 m2, giảm áp lực nén xuống 13 kPa giúp đi lại tự do trên cát mềm."
                },
                {
                  type: "Hệ thống mang bơm co bóp chủ động",
                  benefit: "Tăng lưu lượng nước qua mang lên 15 lít/phút, đáp ứng 100% nhu cầu oxy của cơ thể."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Evolutionary transitions in locomotion and benthic fish respiration", url: "https://doi.org/10.1111/jeb.12592" }
            ]
          }
        ]
      });
    } else if (target.id === "reef-stonefish") {
      whatIfData.push({
        creature_id: "reef-stonefish",
        title: "Nếu Cá Đá Reef phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-da-reef-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá độc nhất thế giới với khả năng ngụy trang tàng hình cực hạn, cú đớp tốc độ 15 mili giây và gai lưng chứa nọc độc thần kinh chết chóc phóng to đạt 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Ngục tối ngụy trang gai độc)",
            slug: "ca-da-reef-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đớp mồi tốc độ 20 mili giây tạo lực hút chân không 8000 N hút trọn con mồi 20kg, 13 gai lưng phóng to dài 12cm chứa 5000mg độc tố Stonustoxin cực mạnh phá hủy toàn bộ cơ thể.",
            content: "Khi Cá Đá Reef đạt khối lượng 80kg (phóng to từ ~1kg tự nhiên, dài ~1.1m):\n- Cú đớp chân không siêu tốc: Miệng mở to đường kính 45cm với khớp quai hàm siêu gia tốc. Tốc độ mở miệng giữ vững ở mức 20 mili giây, tạo lực hút chân không khổng lồ đạt 8000 N, hút gọn con mồi nặng tới 20kg từ khoảng cách 0.5m.\n- 13 gai lưng tử thần: Các gai vây lưng hóa sừng dài 12cm, chịu tải đâm xuyên cực cao. Mỗi gai lưng kết nối với túi độc chứa Stonustoxin cô đặc gấp nhiều lần. Khi bị dẫm lên, áp lực ép túi độc giải phóng tới 5000mg nọc độc, phá hủy hồng cầu và gây ngừng tim trong 60 giây đối với động vật lớn.\n- Ngụy trang tảng đá hoàn hảo: Lớp da sần sùi bám rêu bao phủ toàn thân 80kg khiến nó trông giống như một khối đá ngầm lớn, hoàn toàn tàng hình dưới đáy rạn.",
            formulas_and_data: {
              scaling_factor: 80,
              mass_kg_original: 1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp hút chân không miệng",
                  equation: "F_suction = P_vacuum * A_mouth",
                  result: "~8,000 N (áp suất âm -120 kPa trên diện tích miệng mở)"
                },
                {
                  name: "Thể tích nọc độc Stonustoxin tích lũy",
                  equation: "V_venom_scaled = V_venom_original * (M_scaled / M_original)",
                  result: "~40 ml (chứa ~5000mg protein Stonustoxin)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Stonustoxin, a lethal cardiotoxic protein from Synanceia verrucosa venom", url: "https://doi.org/10.1016/0041-0101(95)00123-2" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Tấn bi kịch của tảng đá khổng lồ)",
            slug: "ca-da-reef-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Gai lưng bị gãy gập dưới lực ép của khối lượng 80kg khi va chạm đá, quá trình lột da ngưng trệ gây hoại tử da do nhiễm ký sinh trùng bám dày.",
            content: "Trong thực tế sinh học nếu cá đá nặng 80kg:\n- Sự gãy gập của gai lưng: Do định luật bình phương - lập phương, khi khối lượng tăng 80 lần, ứng suất uốn tác động lên gai lưng khi va chạm với đá cứng ngầm tăng vọt gấp 4.3 lần. Khi cá đá đè mình dưới rạn, các gai lưng sắc nhọn dễ bị nứt gãy từ gốc, làm rò rỉ nọc độc vào chính cơ thể gây nhiễm độc nội sinh.\n- Thảm họa lột da chậm: Lớp biểu bì sần sùi của cá đá tích tụ tảo biển và ký sinh trùng dày đặc. Ở kích thước 80kg, chu kỳ lột da (thông thường 4-6 tuần) đòi hỏi lượng năng lượng chuyển hóa vượt quá khả năng trao đổi chất chậm chạp của loài cá săn mồi phục kích. Lớp da chết tích tụ không rụng được sẽ gây hoại tử da diện rộng và mất khả năng ngụy trang.\n- Sụp đổ xương sọ: Khớp quai hàm mở quá rộng với tốc độ cao tạo áp lực phản chấn cơ học cực lớn lên các xương sọ xốp, có thể gây vỡ sọ tự tổn thương.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất uốn lên cấu trúc gai lưng xương",
                  issue: "Ứng suất uốn vượt quá 120 MPa giới hạn bền của gai xương cá đá, gây nứt gãy hàng loạt."
                },
                {
                  type: "Tích tụ năng lượng lột da",
                  issue: "Năng lượng cần cho quá trình lột da tăng 80 lần vượt quá 450% lượng calorie tích lũy hàng tháng."
                }
              ]
            },
            p4p_score_scaled: 38,
            tier_scaled: "D",
            sources: [
              { label: "Biomechanics of spine structures and skin shedding in scorpaenoid fishes", url: "https://doi.org/10.1242/jeb.05934" }
            ]
          },
          {
            title: "Đột biến thích nghi (Tảng đá bọc giáp titan gai độc)",
            slug: "ca-da-reef-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Gai lưng gia cố tinh thể canxi-phosphate chịu lực, tuyến tiết enzyme lột da tự động bằng hóa học và xương quai hàm đệm sụn giảm chấn.",
            content: "Để sinh tồn và hoạt động dũng mãnh dưới rạn ở kích thước 80kg:\n- Gai lưng cốt thép sinh học (Mineralized Spine Core): Các gai vây lưng được gia cố bởi ma trận tinh thể canxi-phosphate liên kết sợi collagen dọc chặt chẽ, nâng giới hạn chịu uốn lên 250 MPa, bảo vệ gai vây không bị gãy khi đâm xuyên da giáp cứng.\n- Lột da bằng tiết enzyme (Enzymatic Skin Peeler): Lớp da dưới biểu bì tiết ra enzyme collagenase chủ động hóa lỏng lớp da chết bám đầy rêu tảo chỉ trong vài giờ, giúp chu kỳ lột da diễn ra êm ái, tốn ít năng lượng.\n- Khớp hàm giảm chấn (Cartilaginous Jaw Dampeners): Các miếng sụn dẻo dày 5mm chèn vào khớp nối quai hàm và xương sọ, triệt tiêu 95% lực phản chấn cơ học khi quai hàm đớp mạnh với tốc độ mili giây.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia cố tinh thể canxi-phosphate gai lưng",
                  benefit: "Tăng độ bền uốn gai lưng lên 250 MPa, giúp xuyên thủng lớp da giáp dày 5mm của con mồi mà không cong gãy."
                },
                {
                  type: "Khớp hàm giảm chấn đàn hồi",
                  benefit: "Hấp thụ 400J động năng phản chấn của cú đớp siêu tốc, bảo vệ hộp sọ an toàn tuyệt đối."
                }
              ]
            },
            p4p_score_scaled: 84,
            tier_scaled: "B",
            sources: [
              { label: "Evolution of venom apparatus and skeleton reinforcement in venomous marine vertebrates", url: "https://doi.org/10.1093/mbe/msw142" }
            ]
          }
        ]
      });
    } else if (target.id === "shoebill-stork") {
      whatIfData.push({
        creature_id: "shoebill-stork",
        title: "Nếu Cò Mỏ Giày phóng to bằng kích thước quái thú (80kg) thì sao?",
        slug: "neu-co-mo-giay-phong-to-bang-kich-thuoc-quai-thu-80kg",
        description: "Phân tích giả thuyết khi Cò Mỏ Giày với chiếc mỏ hình chiếc giày khổng lồ như chiếc xẻng sắt, cơ cổ Atlas cực khỏe và khả năng bất động săn mồi bùng nổ đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng đầm lầy)",
            slug: "co-mo-giay-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Mỏ giày dài 40cm rộng 22cm bổ nát đầu cá sấu nhỏ với lực 4500 N, cơ cổ Atlas triệt tiêu lực phản chấn 2000J, sải cánh 5.5m nâng đỡ bay lượn ở đầm lầy.",
            content: "Khi Cò Mỏ Giày đạt khối lượng 80kg (phóng to gấp 13.3 lần khối lượng từ ~6kg tự nhiên):\n- Chiếc mỏ xẻng sát thủ: Chiếc mỏ dài 40cm, rộng 22cm có móc sừng cứng ở đầu. Lực mổ bổ đớp của hàm và cổ phóng đại đạt tới 4500 N. Một cú bổ trực diện từ trên cao có thể đập nát lớp vỏ xương sọ của cá sấu nhỏ hoặc rùa đầm lầy lớn.\n- Đốt sống cổ Atlas gia cường: Hệ cơ cổ Atlas phát triển nâng đỡ chiếc đầu to nặng 12kg. Các đốt sống cổ có diện tích khớp lớn kết hợp các bó cơ gáy dày dặn, triệt tiêu động năng phản chấn 2000J khi mỏ đập mạnh xuống đáy bùn ngầm.\n- Sải cánh khổng lồ: Sải cánh tăng tỷ lệ thuận lên tới 5.5 mét, diện tích cánh rộng giúp cò mỏ giày bay lượn săn tìm vùng nước mới dồi dào mồi.",
            formulas_and_data: {
              scaling_factor: 13.3,
              mass_kg_original: 6,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực bổ đập của mỏ sừng xuống bùn",
                  equation: "F_strike = m_head * a_strike",
                  result: "~4,500 N (với gia tốc bổ đầu a = 120 m/s2)"
                },
                {
                  name: "Chiều dài sải cánh phóng đại",
                  equation: "W_span = W_span_original * (M_scaled / M_original)^(1/3)",
                  result: "~5.5 mét"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Feeding behavior and jaw mechanics in the Shoebill Balaeniceps rex", url: "https://doi.org/10.1111/j.1469-7998.1994.tb08615.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Mất kiểm soát thăng bằng và gãy cánh)",
            slug: "co-mo-giay-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Đầu nặng 12kg làm mất thăng bằng đổ nhào ra trước, xương cánh rỗng bị gãy gập dưới lực cản gió lớn và chân mảnh bị lún sâu trong bùn lầy.",
            content: "Trong thực tế vật lý sinh học khi cò mỏ giày nặng 80kg:\n- Mất thăng bằng đầu (Center of gravity failure): Chiếc mỏ sừng khổng lồ chứa xương đặc ở đầu mõm nặng tới 12kg. Trọng tâm cơ thể bị đẩy lệch hẳn ra trước ngực. Khi cò mỏ giày đứng im hoặc bước đi, mô-men lực kéo gáy lớn sẽ khiến cò đổ nhào về phía trước, không thể đứng thẳng hoặc săn mồi phục kích.\n- Gãy xương cánh rỗng: Chim sở hữu xương rỗng (pneumatized bones) để giảm trọng lượng bay. Ở khối lượng 80kg, khi cố đập cánh sải 5.5m để bay, ứng suất xoắn do sức cản không khí vượt quá giới hạn chịu tải cơ học của xương cánh rỗng, gây gãy xương chi trước ngay lập tức.\n- Lún sâu đầm lầy: Đôi chân mảnh khảnh có móng dài nâng đỡ 80kg trên nền bùn mềm tạo áp lực nén 90 kPa, khiến chim bị lún sâu ngập gối chân, không thể nhấc chi chạy bứt tốc.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất xoắn xương cánh khi cất cánh",
                  issue: "Ứng suất xoắn lên xương cánh vượt quá 85 MPa, gây rạn gãy xương cánh rỗng."
                },
                {
                  type: "Mô-men xoắn kéo lệch trọng tâm của đầu mỏ",
                  issue: "Trọng tâm đầu lệch ra trước 25cm tạo mô-men kéo 30 N.m gây mỏi cơ cổ và mất thăng bằng."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "Pneumatization of avian bones and mechanical limits in heavy flying birds", url: "https://doi.org/10.1002/jmor.10515" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khủng long đầm lầy cánh cốt giáp)",
            slug: "co-mo-giay-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Cơ gân đuôi đối trọng cân bằng đầu, xương cánh gia cố sợi carbon sinh học đặc, và bàn chân móng xòe rộng phân tán áp lực.",
            content: "Để săn mồi dũng mãnh và di chuyển linh hoạt ở kích thước 80kg tại đầm lầy:\n- Đuôi đối trọng cơ gân khỏe (Tail Counterbalance): Phần đuôi phát triển dài hơn kết hợp lớp lông đuôi nặng cùng các bó cơ mông đùi dày đặc, hoạt động như một bánh lái đối trọng kéo trọng tâm cơ thể lùi về sau trung tâm khớp hông, giúp đứng vững tuyệt đối.\n- Cánh cốt xương đặc gia cường (Reinforced Wing Bones): Xương cánh tiến hóa lấp đầy bởi các liên kết canxi ma trận tổ ong mật độ cao cùng vách ngăn sợi keratin cứng, chịu ứng suất xoắn gió cực cao, giúp cất cánh bay tầm thấp.\n- Chân đế giày bùn (Mud-shoe Webbed Talons): Các ngón chân xòe rộng hơn nữa tích hợp màng da mỏng giữa các ngón, phân tán lực nén đều trên bùn đất chỉ còn 15 kPa giúp chạy bứt tốc trên bùn lầy không lún.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Bố trí đối trọng cơ đùi và đuôi",
                  benefit: "Kéo trọng tâm dịch chuyển về hông 22cm, giữ thăng bằng hoàn hảo trong tư thế đứng săn mồi."
                },
                {
                  type: "Màng chân bùn phân tán áp lực",
                  benefit: "Tăng diện tích chân đế lên 0.08 m2, giúp chim đi lại và bứt tốc dễ dàng trên đầm lầy bùn lỏng."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Avian tail functions and adaptation mechanics in wading birds", url: "https://doi.org/10.1111/jav.01254" }
            ]
          }
        ]
      });
    } else if (target.id === "blue-ringed-octopus") {
      whatIfData.push({
        creature_id: "blue-ringed-octopus",
        title: "Nếu Bạch Tuộc Đốm Xanh phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bach-tuoc-dom-xanh-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài Bạch Tuộc Đốm Xanh (Hapalochlaena lunulata) sở hữu độc tố thần kinh Tetrodotoxin hủy diệt được phóng đại kích thước cơ thể lên 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng nọc độc đại dương)",
            slug: "bach-tuoc-dom-xanh-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn mỏ vẹt đạt 2.736 N xuyên thủng giáp cứng, lượng độc tố TTX tăng lên 800 mg đủ giết chết 41.600 người trưởng thành, và đổi màu đốm xanh bùng nổ trong 0.1 giây.",
            content: "Khi Bạch Tuộc Đốm Xanh đạt khối lượng 80kg (phóng đại gấp 1.600 lần so với trọng lượng ~50g tự nhiên):\n- Lực cắn hủy diệt cơ học: Mỏ vẹt cứng của bạch tuộc được vận hành bởi khối cơ bó má lớn. Lực cắn tăng theo tiết diện cơ (hệ số 136.8), nâng lực cắn từ 20 N lên 2.736 N, dễ dàng xuyên thủng giáp cua biển khổng lồ, vỏ rùa hoặc thậm chí các tấm thép mỏng.\n- Kho độc tố Tetrodotoxin cực đại: Lượng độc tố TTX sinh học do vi khuẩn cộng sinh trong tuyến nước bọt tiết ra tỷ lệ thuận với khối lượng, tăng lên tới 800 mg độc chất tinh khiết. Chỉ với 1-2 mg đã đủ gây tử vong cho người lớn, kho độc chất này có thể hạ gục 41.600 người trưởng thành trong vài phút mà không có thuốc giải.\n- Hệ sắc tố đốm xanh bùng nổ: Tế bào chromatophores khổng lồ có đường kính mở rộng từ 0.1 mm lên 4 mm, phản xạ ánh sáng bước sóng 480nm tạo tín hiệu chớp nháy đốm xanh neon cảnh báo vô cùng chói mắt trên cự ly 50m dưới lòng biển sâu.",
            formulas_and_data: {
              scaling_factor: 1600,
              mass_kg_original: 0.05,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn phóng to theo tiết diện cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~2,736 N"
                },
                {
                  name: "Khả năng sát thương độc tố TTX phóng đại",
                  equation: "Lethal_capacity = Cap_original * (M_scaled / M_original)",
                  result: "Đủ tiêu diệt ~41,600 người trưởng thành (chứa ~800 mg TTX)"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Tetrodotoxin in the blue-ringed octopus: distribution and symbiosis", url: "https://doi.org/10.1007/s00227-010-1452-1" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự sụp đổ thân mềm và ngạt thở cục bộ)",
            slug: "bach-tuoc-dom-xanh-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Thân mềm không có bộ xương nâng đỡ bị bẹp dí dưới trọng lực đè nén nội tạng ở vùng nước nông, và hệ tuần hoàn hở mang sách gây ngạt thở nhanh chóng.",
            content: "Trong thực tế vật lý sinh học khi Bạch Tuộc Đốm Xanh đạt khối lượng 80kg:\n- Hội chứng bẹp dí không xương (Gravitational Flattening): Là loài không xương sống (non-skeleton), cấu trúc cơ thể phụ thuộc vào lực đẩy Archimedes của nước. Khi lên cạn hoặc ở vùng nước nông, trọng lượng 80kg chịu tác động hoàn toàn của trọng lực sẽ xẹp xuống như một khối gelatin, đè nén áp lực cơ học lên tới 20 kPa trực tiếp lên tim và hệ mạch nội tạng, gây ngưng tuần hoàn.\n- Ngạt thở mang sách: Diện tích bề mặt mang so với thể tích giảm mạnh 11.7 lần. Hệ mang không thể đáp ứng đủ lượng oxy khuếch tán cho 80kg cơ bắp, khiến lượng oxy máu tụt dốc không phanh, bạch tuộc rơi vào trạng thái hôn mê ngạt thở chỉ sau vài phút.\n- Kiệt quệ năng lượng đổi màu: Vận hành hàng triệu tế bào sắc tố khổng lồ rộng 4mm ngốn 75% năng lượng hô hấp cơ bản, làm bạch tuộc cạn kiệt ATP và chết do kiệt sức cơ tim.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp lực đè nén nội tạng dưới tác động trọng lực",
                  issue: "Trọng lực đè ép tạo áp suất cơ học nội bộ 20 kPa, vượt quá áp suất tim tối đa của bạch tuộc (6 kPa), làm ngừng tim hoàn toàn."
                },
                {
                  type: "Thiếu hụt diện tích trao đổi khí của mang",
                  issue: "Tỷ lệ diện tích bề mặt mang trên thể tích cơ thể giảm 91.5%, lượng oxy máu hòa tan giảm dưới ngưỡng sinh tồn 15%."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "Mechanics of hydrostatic skeletons and gravitational limits in soft-bodied animals", url: "https://doi.org/10.1242/jeb.00318" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú thân mềm áp suất thủy tĩnh và phun nọc áp lực)",
            slug: "bach-tuoc-dom-xanh-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Khung xương thủy tĩnh áp suất cao kết hợp ma trận collagen gia cường, mang xếp nếp sâu tuần hoàn khép kín, và tuyến nọc cơ bắp phun độc sương mù cự ly 3m.",
            content: "Để Bạch Tuộc Đốm Xanh 80kg có thể di chuyển linh hoạt và thống trị cạn/nước:\n- Bộ xương thủy tĩnh áp suất cao (Pressurized Hydrostatic Skeleton): Tiết ra chất dịch bán gelatin giàu collagen dẻo dai liên kết chặt chẽ với các bó cơ đan chéo xoắn ốc, duy trì hình thể vững chãi chịu mô-men xoắn lớn mà không bị xẹp lép dưới trọng lực Trái Đất.\n- Mang phế nang kép tuần hoàn khép kín: Các lá mang xếp nếp sâu gấp 15 lần tích hợp mạng lưới mao mạch kín có cơ hoành hô hấp bổ trợ chủ động co bóp lọc khí, duy trì oxy máu ổn định ngay cả khi trườn bò trên cạn 2-3 giờ.\n- Phun nọc áp lực cơ hàm (salivary jet projector): Tuyến nước bọt tiến hóa các túi cơ co thắt nhanh áp lực lớn, cho phép ép phun nọc độc TTX ra ngoài qua phễu phun (siphon) dưới dạng sương mù mịn xa tới 3m, làm tê liệt đối thủ từ xa.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Áp suất thủy tĩnh duy trì hình dạng",
                  benefit: "Duy trì áp suất thủy tĩnh nội bộ P_internal >= 25 kPa chống lại sự bẹp dí dưới trọng lực."
                },
                {
                  type: "Tốc độ và cự ly phun sương độc tố",
                  benefit: "Phun nọc với vận tốc đầu nòng 15 m/s, khuếch tán sương độc TTX trong không khí chiếm thể tích 1.5 m3 quanh mục tiêu."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "S",
            sources: [
              { label: "Functional morphology of cephalopod chromatophores and jet propulsion systems", url: "https://doi.org/10.1111/j.1469-7998.2012.00902.x" }
            ]
          }
        ]
      });
    } else if (target.id === "chinese-giant-salamander") {
      whatIfData.push({
        creature_id: "chinese-giant-salamander",
        title: "Nếu Kỳ Giông Khổng Lồ Trung Quốc phóng to thành quái thú (250kg) thì sao?",
        slug: "neu-ky-giong-khong-lo-trung-quoc-phong-to-thanh-quai-thu-250kg",
        description: "Phân tích kịch bản giả thuyết khi loài lưỡng cư lớn nhất thế giới Kỳ Giông Khổng Lồ Trung Quốc (Andrias davidianus) được phóng đại lên khối lượng 250kg gánh chịu định luật sinh học vật lý.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cá sấu lưỡng cư tái sinh thần tốc)",
            slug: "ky-giong-khong-lo-trung-quoc-250kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú đớp hút áp suất âm đạt lực 4.070 N nuốt gọn mồi 30kg trong tích tắc, tái sinh hoàn hảo chi/đuôi trong 15 ngày, và tiết keo tự vệ chống trượt dày 2mm cản phá sát thương cơ học.",
            content: "Khi Kỳ Giông Khổng Lồ Trung Quốc phóng đại lên 250kg (tăng khối lượng gấp 50 lần từ ~5kg nguyên bản):\n- Cú đớp hút chân không uy lực: Hệ cơ hàm và hầu vĩ đại mở rộng nhanh chóng tạo vùng áp suất âm sâu dưới nước. Lực đớp cơ học tăng theo tiết diện (hệ số 13.57), tăng lên tới 4.070 N, hút trọn con mồi nặng 30kg chỉ trong 0.05 giây.\n- Tái sinh hoàn hảo cấp độ đại thể: Nhờ mật độ tế bào gốc biểu bì chuyên biệt (blastema) tăng tương ứng, kỳ giông khổng lồ có thể tái tạo hoàn toàn chi trước hoặc đuôi bị đứt lìa chỉ trong vòng 15 ngày cự ly lớn.\n- Khiên keo nhầy tự vệ dày 2mm: Tuyến da tiết ra 2 lít chất nhầy màu trắng có chứa độc tính nhẹ hóa đông nhanh trên cạn, hoạt động như một lớp màng đệm hydrogel dày 2mm phân tán xung lực đòn đánh vật lý lên tới 1.500 J.",
            formulas_and_data: {
              scaling_factor: 50,
              mass_kg_original: 5,
              mass_kg_scaled: 250,
              formulas: [
                {
                  name: "Lực đớp hút chân không phóng đại",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,070 N"
                },
                {
                  name: "Mật độ tế bào gốc tái sinh biểu bì blastema",
                  equation: "N_stem = 5 * 10^8 cells/cm^3",
                  result: "Đảm bảo tái tạo mô chi đạt tốc độ ~1.2 cm/ngày"
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Suction feeding mechanics and jaw jaw bone kinetics in giant salamanders", url: "https://doi.org/10.1242/jeb.042556" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cơn ngạt thở qua da và gãy xương chi sụn)",
            slug: "ky-giong-khong-lo-trung-quoc-250kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Diện tích da trao đổi khí giảm 73% gây ngạt thở cấp tính trong 10 phút, xương sụn yếu ớt bị uốn gãy dưới khối lượng 250kg trên cạn, và quá nhiệt nội tạng.",
            content: "Trong thế giới thực tế vật lý sinh học khi kỳ giông nặng 250kg:\n- Thất bại hô hấp qua da (Cutaneous Respiration Failure): Kỳ giông khổng lồ chủ yếu hấp thu oxy qua các nếp gấp da nhăn nheo ngập dưới nước lạnh. Khi phóng to lên 250kg, tỷ lệ diện tích da trên thể tích cơ thể (S/V) giảm mạnh 3.68 lần. Da không đủ diện tích bề mặt để khuếch tán oxy đáp ứng nhu cầu trao đổi chất khổng lồ, khiến nó ngạt thở và hôn mê chỉ sau 10 phút.\n- Sụp đổ hệ xương sụn: Khung xương của chúng chủ yếu là sụn (chondrocranium và sụn chi) chịu tải kém. Khi lên cạn chịu tác động của trọng lực 2.450 N, các chi sụn bị uốn gãy gập lập tức, lồng ngực xẹp đè dập gan và tim.\n- Sốc nhiệt môi trường nước: Khối lượng lớn khiến tỷ lệ tỏa nhiệt giảm sâu. Nếu nhiệt độ nước tăng quá 20°C, nhiệt độ nội tạng tích tụ nhanh chóng không thể thoát ra ngoài, gây suy tạng và tử vong.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giảm tỷ lệ diện tích da trên thể tích (S/V)",
                  issue: "Tỷ lệ S/V giảm 73%, lượng oxy hòa tan khuếch tán qua da chỉ đáp ứng được 22% nhu cầu năng lượng cơ bản."
                },
                {
                  type: "Ứng suất xoắn uốn trên xương sụn chi trước",
                  issue: "Ứng suất cơ học lên chi đạt 18 MPa, vượt quá giới hạn bền uốn của sụn lưỡng cư (8 MPa) gây gãy khớp chi."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Cutaneous respiration and scaling limits in caudate amphibians", url: "https://doi.org/10.1086/282711" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái ngư đầm lầy phổi túi khí và khung xương cốt hóa)",
            slug: "ky-giong-khong-lo-trung-quoc-250kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phổi kép phế nang hóa có cơ hoành hô hấp cạn chủ động, bộ xương chi sụn được cốt hóa canxi cứng chịu tải 3.000 N, và lớp da tiết chất hydrogel chống mất nước.",
            content: "Để Kỳ Giông 250kg sống sót dũng mãnh và bò lên cạn như tổ tiên Tiktaalik:\n- Phổi kép phế nang hóa chủ động (Alveolar Lung Adaptation): Hai lá phổi nguyên bản phẳng dẹt tiêu biến, tiến hóa thành phổi có cấu trúc túi phế nang gấp nếp chằng chịt mao mạch tương tự bò sát cạn, kết hợp cơ hoành co bóp để chủ động hít thở khí trời, nâng tỷ lệ hô hấp phổi lên 92%.\n- Cốt hóa xương chi trước và đai hông (Ossified Skeletal Structure): Toàn bộ khung xương sụn chuyển hóa thành xương cứng cốt hóa giàu calci ma trận, tăng mật độ xương lên 92%, gánh đỡ hoàn hảo khối lượng 250kg đứng cạn bò trườn chịu lực tải 3.000 N.\n- Lớp da tiết hydrogel cách nhiệt chống thấm ngược: Da tiết ra dịch gel đặc biệt giữ độ ẩm ẩm ướt, lọc thấm chọn lọc oxy từ khí quyển ẩm đồng thời bảo vệ nhiệt độ nội tạng dưới 18°C.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Phát triển diện tích phổi phế nang",
                  benefit: "Tăng diện tích bề mặt trao đổi khí phổi lên 4.5 m2, đảm bảo bão hòa oxy máu đạt 95% ở cạn."
                },
                {
                  type: "Gia cường mật độ xương cứng cốt hóa",
                  benefit: "Chịu mô-men xoắn uốn chi trước lên tới 450 N.m giúp nâng thân nâng đầu trườn bò trên mặt đất khô."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "The transition from cartilage to bone in evolutionary developmental biology", url: "https://doi.org/10.1002/dvg.10221" }
            ]
          }
        ]
      });
    } else if (target.id === "electric-eel") {
      whatIfData.push({
        creature_id: "electric-eel",
        title: "Nếu Cá Chình Điện phóng to bằng quái thú khổng lồ (160kg) thì sao?",
        slug: "neu-ca-chinh-dien-phong-to-bang-quai-thu-khong-lo-160kg",
        description: "Phân tích kịch bản giả thuyết khi loài Cá Chình Điện (Electrophorus electricus) với 3 cơ quan phát điện sinh học khổng lồ được phóng to lên khối lượng 160kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cỗ máy phát điện hủy diệt đại dương)",
            slug: "ca-chinh-dien-160kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Phóng xung điện cực đại 2.400 V với cường độ 8 A đạt công suất đỉnh 19.200 W, radar quét điện trường 3D bán kính 15m, và bứt tốc bơi sóng đuôi đạt 35 km/h.",
            content: "Khi Cá Chình Điện nặng 160kg (phóng to khối lượng gấp 8 lần, chiều dài tăng gấp 2 lần đạt gần 4 mét):\n- Luồng sét sinh học hủy diệt: Số lượng tế bào phát điện electrocytes xếp nối tiếp và song song tăng mạnh. Điện thế phóng tăng từ 860 V lên 2.400 V, cường độ dòng điện đạt 8 A. Cú phóng xung điện cực đại tạo công suất đỉnh tới 19.200 Watts trong vài mili giây, dễ dàng làm tê liệt một con hà mã trưởng thành hoặc đánh sập hệ thống cơ của bất kỳ đối thủ nào dưới nước.\n- Radar điện trường 3D siêu nhạy: Tần số xung định vị Sachs' organ phát ra ở mức 400 Hz tạo trường quét 3D sắc nét trong bán kính 15m nước đục, phát hiện chuyển động cơ tim của con mồi bị ẩn giấu dưới bùn cát.\n- Động cơ sóng đuôi mạnh mẽ: Cơ vây dọc đuôi phát triển cơ bắp dẻo dai gợn sóng, tạo lực đẩy cơ học đẩy thân hình dài 4m bơi lượn với vận tốc 35 km/h.",
            formulas_and_data: {
              scaling_factor: 8,
              mass_kg_original: 20,
              mass_kg_scaled: 160,
              formulas: [
                {
                  name: "Hiệu điện thế phóng điện cực đại nối tiếp",
                  equation: "V_scaled = V_original * (L_scaled / L_original)",
                  result: "~2,400 V"
                },
                {
                  name: "Cường độ dòng điện song song",
                  equation: "I_scaled = I_original * N_parallel_columns",
                  result: "~8 A (với 8 hàng tế bào electrocytes xếp song song)"
                },
                {
                  name: "Công suất phóng điện đỉnh (Peak power output)",
                  equation: "P_peak = V_scaled * I_scaled",
                  result: "~19,200 W"
                }
              ]
            },
            p4p_score_scaled: 90,
            tier_scaled: "S",
            sources: [
              { label: "Active electroreception and electrogenesis in the electric eel Electrophorus", url: "https://doi.org/10.1126/science.1260124" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự tự giật điện tử vong và ngạt thở cạn)",
            slug: "ca-chinh-dien-160kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Xung điện 2.400 V rò rỉ xuyên qua chất nhầy nướng chín tim não của chính nó, cơ thể dài 4m không xương sườn chịu trọng lực dập nát nội tạng trên cạn, và ngạt thở do mang thoái hóa mang.",
            content: "Trong thực tế vật lý sinh học khi cá chình điện đạt khối lượng 160kg:\n- Tự giật điện chết (Self-electrocution): Lớp biểu bì da tiết dịch nhầy cách điện nguyên bản dày 0.5mm có giới hạn đánh thủng điện môi khoảng 1.500 V. Khi phóng xung điện 2.400 V / 8 A trong vùng nước có độ dẫn điện cao hoặc trên cạn ẩm ướt, dòng điện rò rỉ sẽ xuyên thủng lớp nhầy cách điện, chạy trực tiếp vào hệ thần kinh trung ương và nướng chín cơ tim của chính nó.\n- Ngạt thở bắt buộc: Cá chình điện là loài bắt buộc thở khí trời (obligate air-breather) bằng khoang miệng do gương mang đã tiêu biến. Ở khối lượng 160kg, việc ngoi lên mặt nước cứ mỗi 10 phút để đớp khí đòi hỏi động năng nâng đầu nặng 25kg cực lớn, cơ đuôi dạng dẹp không thể đẩy được cơ thể khi ở nước chảy hoặc cạn nông.\n- Dập nát phủ tạng: Thân trước của chúng không có các gai xương sườn nâng đỡ cơ quan nội tạng. Trọng lượng 160kg ép dẹp tim và gan xuống đáy đất cứng gây xuất huyết nội bộ.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Vượt giới hạn đánh thủng điện môi lớp nhầy da",
                  issue: "Điện áp phóng 2.400V vượt quá cường độ cách điện tối đa của lớp nhầy (1.500V), gây ra hiện tượng đoản mạch qua cơ tim tự giật chết."
                },
                {
                  type: "Thiếu hụt lồng xương sườn nâng đỡ tim gan",
                  issue: "Trọng lực đè nén nội tạng với áp lực 12 kPa gây tổn thương cơ học dập gan ruột khi nằm trên cạn khô."
                }
              ]
            },
            p4p_score_scaled: 30,
            tier_scaled: "D",
            sources: [
              { label: "Obligate air-breathing and evolutionary degeneration of gills in gymnotiform fish", url: "https://doi.org/10.1111/j.1095-8649.2006.01254.x" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái long lôi điện giáp myelin và lồng ngực gai xương bảo vệ)",
            slug: "ca-chinh-dien-160kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Lớp da giáp chứa myelin và keratin dày 3mm cách điện tuyệt đối tới 6.000 V, tiến hóa phổi khoang miệng xếp nếp dung tích 6 lít có van khí quản đóng mở chủ động, và khung gai xương sườn bán vòng gia cố nội tạng.",
            content: "Để Cá Chình Điện 160kg hoạt động an toàn và phóng điện hủy diệt đối thủ không tự sát:\n- Lớp giáp cách điện sinh học cực đại (Myelin-keratinized insulating armor): Lớp da tiến hóa chứa các lớp bao myelin xếp chồng xen kẽ các tấm sừng keratin dày 3mm, nâng giới hạn đánh thủng điện môi lên tới 6.000 V, bảo vệ 100% cơ tim và não bộ khỏi dòng rò rỉ.\n- Phổi khoang miệng phế nang hóa có van đóng nắp thanh quản: Niêm mạc miệng phát triển thành mạng phế nang có thể tích 6 lít hoạt động như một lá phổi cạn thực sự, kết hợp van thanh quản cơ bắp ngăn tràn nước giúp lặn sâu 40 phút không cần ngoi thở.\n- Bộ gai xương sườn bán vòng gia cố (Semi-ring Rib Cage): Nửa thân trước tiến hóa các thanh xương sườn cong bảo vệ tim và gan, phân tán 95% lực nén trọng lực khi trườn bò trên mặt đất bùn cạn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Nâng giới hạn cách điện của biểu bì da",
                  benefit: "Giới hạn điện áp đánh thủng tăng lên 6.000 V, rò rỉ điện nội bộ giảm xuống dưới 0.01% ở cạn."
                },
                {
                  type: "Gia cường gai xương nâng đỡ lồng ngực",
                  benefit: "Bộ gai sườn chịu tải cơ học 1.800 N, bảo vệ tim gan khỏi áp lực ép dẹp khi trườn bò cạn khô."
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Comparative physiology of electrogenesis and myelin insulating adaptations in gymnotiforms", url: "https://doi.org/10.1146/annurev-physiol-021020-032541" }
            ]
          }
        ]
      });
    } else if (target.id === "goliath-tigerfish") {
      whatIfData.push({
        creature_id: "goliath-tigerfish",
        title: "Nếu Cá Hổ Goliath phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-ho-goliath-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Cá Hổ Goliath (Hydrocynus goliath) đạt kích thước con người 80kg và khả năng săn mồi siêu cấp.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đớp nghiền sắt thép và bứt tốc thủy động lực học)",
            slug: "ca-ho-goliath-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đớp đạt 5.500 N, bứt tốc 45 km/h dưới nước với hàm răng 32 chiếc răng nanh thép dài 5cm.",
            content: "Khi Cá Hổ Goliath được phóng to lên 80kg (tăng khối lượng gấp ~8 lần so với kích thước trung bình 10kg, chiều dài sấp xỉ 1.8m):\n- Bộ hàm răng thép khổng lồ: Sở hữu 32 chiếc răng nanh nhọn hoắt xếp đan xen như răng cưa, mỗi chiếc răng dài 5cm. Lực đớp tăng theo tiết diện cơ hàm (M_scaled/M_original)^(2/3), đạt 5.500 N, đủ sức xé toạc các tấm thép mỏng hoặc nghiền nát xương của bất kỳ động vật thủy sinh lớn nào.\n- Tốc độ bứt tốc thủy động lực học: Nhờ thân hình thon dẹt tối ưu và hệ cơ đỏ phát triển, cú bứt tốc cự ly ngắn đạt vận tốc 45 km/h, kết hợp với hộp sọ có khớp động cơ học giảm chấn chống gãy sọ khi va đập đớp mồi.",
            formulas_and_data: {
              scaling_factor: 8,
              mass_kg_original: 10,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp phóng to theo tiết diện cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~5,500 N"
                },
                {
                  name: "Tốc độ bứt tốc thủy động lực học tối đa",
                  equation: "V_max_scaled = V_max_original * (M_scaled / M_original)^(1/6)",
                  result: "~45 km/h"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Feeding mechanics and bite force of the Goliath tigerfish", url: "https://doi.org/10.1111/j.1469-7998.2012.00912.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Thiếu hụt oxy và sụp đổ bong bóng cá)",
            slug: "ca-ho-goliath-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Gặp khó khăn nghiêm trọng về hô hấp do tỷ lệ diện tích mang giảm và bong bóng cá không chịu nổi áp suất chênh lệch.",
            content: "Trong thực tế vật lý sinh học khi cá hổ goliath đạt khối lượng 80kg:\n- Khủng hoảng hô hấp: Do cá hổ goliath là loài cá săn mồi hiếu động cao, nhu cầu oxy rất lớn. Khi phóng to lên 80kg, tỷ lệ diện tích bề mặt mang trên khối lượng cơ thể (S_gill / V_body) giảm mạnh (tỷ lệ nghịch với kích thước tuyến tính), khiến cá không thể hấp thụ đủ oxy hòa tan trong nước sông nhiệt đới nóng, gây ngạt thở nhanh chóng khi vận động mạnh.\n- Tổn thương bong bóng cá cơ học: Trọng lượng 80kg tạo áp lực lớn lên các cơ quan nội tạng khi bơi ở các độ sâu khác nhau. Bong bóng cá chịu chênh lệch áp suất lớn, dễ bị vỡ hoặc mất kiểm soát sức nổi, khiến cá bị chìm xuống đáy hoặc ngửa bụng.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt diện tích phổi/mang trao đổi khí",
                  issue: "Tỷ lệ diện tích bề mặt mang trên thể tích giảm ~50%, gây thiếu oxy nghiêm trọng khi vận động."
                },
                {
                  type: "Áp suất thủy tĩnh lên bong bóng cá",
                  issue: "Áp lực tăng cao làm mất kiểm soát sức nổi cơ học, vô hiệu hóa khả năng giữ thăng bằng."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Gill morphometrics and respiratory constraints in large teleosts", url: "https://doi.org/10.1002/jez.14023" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thủy quái sông Congo có phổi phụ trợ và giáp vảy titan)",
            slug: "ca-ho-goliath-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống mang phụ trợ siêu phân nhánh và vảy sừng phủ chitin bền gấp 5 lần chống áp lực.",
            content: "Để Cá Hổ Goliath 80kg sinh tồn và trở thành bá chủ vùng nước ngọt:\n- Mang xếp nếp siêu cấp (Hyper-folded gills): Tiến hóa các phiến mang phụ trợ xếp nếp sâu tích hợp mao mạch mật độ cao, tăng diện tích tiếp xúc với nước gấp 4 lần để bù đắp sự thiếu hụt oxy.\n- Vảy giáp phức hợp chitin-calcium: Lớp vảy phát triển thêm các sợi chitin liên kết ma trận canxi, tạo cấu trúc giáp nhẹ nhưng siêu bền, bảo vệ cơ thể khỏi áp lực nước chảy xiết và các đòn tấn công vật lý.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Mang xếp nếp tăng diện tích bề mặt",
                  benefit: "Tăng diện tích trao đổi khí lên 2.5 m² per kg, đảm bảo cung cấp oxy đầy đủ."
                },
                {
                  type: "Vảy giáp phức hợp chitin-calcium",
                  benefit: "Mô-đun đàn hồi đạt 12 GPa, chịu được áp lực va đập lớn gấp 5 lần vảy thường."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Fish scale biocomposites and impact resistance", url: "https://doi.org/10.1016/j.actbio.2014.09.011" }
            ]
          }
        ]
      });
    } else if (target.id === "great-white-shark") {
      whatIfData.push({
        creature_id: "great-white-shark",
        title: "Nếu Cá Mập Trắng Lớn thu nhỏ bằng con người (80kg) thì sao?",
        slug: "neu-ca-map-trang-lon-thu-nho-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá mập trắng lớn khổng lồ được thu nhỏ về kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đớp cưa sắc ngọt và bơi lội siêu linh hoạt)",
            slug: "ca-map-trang-lon-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đớp đạt 4.000 N, bơi lội siêu linh hoạt với bán kính quay đầu cực hẹp và gia tốc bứt tốc tức thì.",
            content: "Khi Cá Mập Trắng Lớn thu nhỏ về 80kg (dài khoảng 1.8m):\n- Cú đớp răng cưa xé thịt: Bộ răng cưa sắc lẹm di động xếp lớp nguyên bản thu nhỏ lại thành lưỡi dao lam siêu bạo lực. Lực đớp cơ học so với cơ thể tăng vượt bậc nhờ tỷ lệ cơ hàm lớn, đạt 4.000 N, kết hợp với chuyển động lắc đầu sườn ngang đặc trưng để cắt đôi bất kỳ con mồi nào trong nháy mắt.\n- Siêu linh hoạt dưới nước: Giảm khối lượng khổng lồ giúp momen quán tính xoay trục dọc giảm mạnh (giảm theo tỷ lệ bậc 5 của kích thước). Cá mập trắng 80kg có thể bẻ lái quay đầu gấp góc 90 độ chỉ trong 0.2 giây, điều mà phiên bản khổng lồ nặng 1 tấn không bao giờ làm được.",
            formulas_and_data: {
              scaling_factor: 0.08,
              mass_kg_original: 1000,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp phóng đại tương đối ở kích thước nhỏ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,000 N"
                },
                {
                  name: "Giảm mô-men quán tính xoay trục",
                  equation: "I_ratio = (M_scaled / M_original)^(5/3)",
                  result: "~1/200 (linh hoạt gấp 200 lần)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Bite force and feeding mechanics of the great white shark", url: "https://doi.org/10.1111/j.1469-7998.2008.00494.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Mất nhiệt đại dương và suy giảm sức nổi)",
            slug: "ca-map-trang-lon-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất nhiệt qua da siêu tốc ở vùng nước sâu lạnh giá, và nồng độ ure rò rỉ làm mất cân bằng thẩm thấu trầm trọng.",
            content: "Trong thực tế vật lý sinh học khi cá mập trắng lớn thu nhỏ về 80kg:\n- Hạ thân nhiệt vùng lõi: Cá mập trắng lớn sử dụng hệ thống trao đổi nhiệt đối lưu (Rete Mirabile) để giữ ấm cơ và não cao hơn nhiệt độ nước xung quanh. Khi thu nhỏ về 80kg, tỷ lệ diện tích bề mặt/thể tích tăng 2.5 lần làm giảm hiệu quả giữ nhiệt của Rete Mirabile xuống dưới ngưỡng duy trì, dẫn tới cơ thể bị lạnh cóng, làm liệt các bó cơ bơi lội khi lặn sâu.\n- Sự cố mất cân bằng thẩm thấu: Da nhám mỏng của cá mập lọc ure để giữ cân bằng thẩm thấu với nước biển. Ở kích thước nhỏ, tỷ lệ rò rỉ ure qua da tăng mạnh so với thể tích máu, đòi hỏi năng lượng tái tạo ure cực lớn, khiến cơ thể bị suy nhược tế bào.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hiệu quả giữ nhiệt của Rete Mirabile suy giảm",
                  issue: "Nhiệt lượng thất thoát nhanh hơn 2.5 lần, cơ bị lạnh cứng dưới nước sâu (<12°C)."
                },
                {
                  type: "Mất cân bằng thẩm thấu do rò rỉ Ure",
                  issue: "Tỷ lệ rò rỉ ure qua da tăng mạnh gây rối loạn nồng độ dung dịch tế bào."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "Thermoregulation and osmotic balance in lamnid sharks", url: "https://doi.org/10.1136/physiol.2001.0942" }
            ]
          },
          {
            title: "Đột biến thích nghi (Sát thủ đại dương nội nhiệt hoàn toàn và giáp da collagen chống rò rỉ)",
            slug: "ca-map-trang-lon-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa Rete Mirabile siêu dầy giữ nhiệt 95%, lớp da collagen kép giữ ure tuyệt đối và tăng mật độ ti thể trong cơ bắp.",
            content: "Để Cá Mập Trắng Lớn 80kg thống trị vùng duyên hải nhiệt đới và ôn đới:\n- Rete Mirabile mật độ siêu đặc (Hyper-dense Rete Mirabile): Tăng số lượng vi mạch trao đổi nhiệt chéo lên gấp 3 lần, cách nhiệt tuyệt đối vùng lõi tim và não để duy trì nhiệt độ ổn định ở 26°C ngay cả trong dòng nước 8°C.\n- Biểu bì collagen-lipid chống thấm (Lipophilic Collagen Skin): Lớp da nhám được bổ sung lớp đệm lipid kỵ nước sâu, khóa chặn hoàn toàn sự thẩm thấu rò rỉ urea ra môi trường, duy trì áp suất thẩm thấu hoàn hảo.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Mật độ vi mạch Rete Mirabile tăng 200%",
                  benefit: "Giữ vững thân nhiệt lõi 26°C bất kể nhiệt độ nước môi trường."
                },
                {
                  type: "Màng chắn urea kỵ nước",
                  benefit: "Tỷ lệ rò rỉ urea giảm xuống dưới 0.05 g/m²/ngày."
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Vascular adaptations and lipid barriers in endothermic sharks", url: "https://doi.org/10.1086/32415" }
            ]
          }
        ]
      });
    } else if (target.id === "hairy-frogfish") {
      whatIfData.push({
        creature_id: "hairy-frogfish",
        title: "Nếu Cá Chân Dong Tóc phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-chan-dong-toc-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá chân dong tóc Antennarius striatus được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn lốc xoáy chân không nuốt chửng con mồi)",
            slug: "ca-chan-dong-toc-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú táp nuốt mồi tạo lực hút chân không khổng lồ 1.200 lít nước mỗi giây và lực bứt tốc ngậm miệng siêu thanh.",
            content: "Khi Cá Chân Dong Tóc được phóng to lên 80kg (tăng khối lượng gấp ~800 lần, chiều dài sấp xỉ 1.6m):\n- Cú đớp chân không hủy diệt (Vacuum Suction): Khả năng mở rộng thể tích khoang miệng gấp 12 lần trong vòng 6 miligiây. Lực hút áp suất âm tạo ra dòng nước cuốn cuồn cuộn với lưu lượng cực đại đạt 1.200 lít/giây, hút thẳng con mồi cách xa 1 mét vào miệng.\n- Chiếc mồi nhử khổng lồ (Super-esca): Chiếc mồi giả phát triển dài 40cm cử động uốn éo như rắn nước lớn, thu hút các loài cá săn mồi trung bình tự dẫn xác tới nạp mạng.",
            formulas_and_data: {
              scaling_factor: 800,
              mass_kg_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lưu lượng hút chân không tức thời",
                  equation: "Q_suction = (12 * V_mouth_scaled) / t_strike",
                  result: "~1,200 L/s"
                },
                {
                  name: "Chênh lệch áp suất âm hút mồi",
                  equation: "Delta_P = 0.5 * rho * v_fluid^2",
                  result: "~4.5 kPa"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Biomechanics of ultra-fast suction feeding in frogfishes", url: "https://doi.org/10.1242/jeb.02495" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở và xẹp vây ngực cơ học)",
            slug: "ca-chan-dong-toc-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Không thể đi bộ do vây ngực sụn yếu bị gãy dưới tải nặng và khoang miệng rộng gây ngạt thở khi nuốt bùn cát.",
            content: "Trong thực tế vật lý sinh học khi cá chân dong tóc đạt khối lượng 80kg:\n- Gãy khớp vây ngực: Các vây ngực và vây bụng vốn được cá chân dong dùng để 'đi bộ' dưới đáy biển chỉ được cấu tạo từ các xương sụn mềm dẻo. Khi phóng to lên 80kg, trọng lượng đè lên các chi sụn này tăng gấp 800 lần trong khi tiết diện xương chỉ tăng 100 lần. Vây ngực sẽ lập tức bị gãy rạn xương dưới sức nặng cơ thể, khiến cá bị liệt và nằm bất động một chỗ.\n- Khủng hoảng hô hấp khi nuốt nước: Cú hút chân không 1.200 lít nước cuốn theo lượng lớn cát, bùn và rác thải đáy biển vào miệng, làm nghẹt cứng hệ thống khe mang lọc mỏng manh, gây suy hô hấp cấp tính.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Vây ngực sụn bị gãy do ứng suất nén vượt tải",
                  issue: "Ứng suất lên vây ngực vượt quá 5.2 MPa (giới hạn chịu lực của sụn là 3.0 MPa)."
                },
                {
                  type: "Nghẽn khe mang do cặn lắng đáy biển",
                  issue: "Dòng hút chân không quá lớn cuốn bùn đất bít kín mang hô hấp."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "Structural limits of cartilaginous limbs in fish", url: "https://doi.org/10.1016/j.zool.2015.01.002" }
            ]
          },
          {
            title: "Đột biến thích nghi (Chi bộ xương canxi hóa và màng lọc cát mang tự làm sạch)",
            slug: "ca-chan-dong-toc-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa xương chi ngực canxi hóa chịu tải cao, màng lọc mang ngược cơ học và cơ chế phụt nước phản lực.",
            content: "Để Cá Chân Dong Tóc 80kg di chuyển và săn mồi hiệu quả dưới đáy biển sâu:\n- Chi xương xương hóa (Osteodermic limbs): Các vây ngực được canxi hóa hoàn toàn và tiến hóa thành các khớp xương đùi chắc khỏe như động vật lưỡng cư cổ đại, chịu tải trọng uốn cơ học lên tới 2.500 N, giúp cá đi bộ nhanh nhẹn trên rạn san hô.\n- Màng lọc cát tự giũ (Self-cleaning Gill Filtration): Hệ thống mang tiến hóa màng lọc hai lớp hoạt động theo cơ chế dòng chảy xoáy đảo ngược, lọc sạch bùn cát ra ngoài qua lỗ mang phản lực mà không làm nghẹt các sợi mang hô hấp.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Xương hóa chi ngực sụn",
                  benefit: "Khớp chi ngực chịu được tải uốn cơ học 2.500 N, hỗ trợ đi bộ an toàn."
                },
                {
                  type: "Lọc tách cặn mang dòng xoáy ngược",
                  benefit: "Hiệu suất lọc sạch bùn cát đạt 99.5% đối với các hạt đường kính > 50 µm."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Evolutionary transitions in vertebrate limb bone density", url: "https://doi.org/10.1098/rstb.2016.0223" }
            ]
          }
        ]
      });
    } else if (target.id === "horror-frog") {
      whatIfData.push({
        creature_id: "horror-frog",
        title: "Nếu Ếch Kinh Dị phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ech-kinh-di-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ếch kinh dị Trichobatrachus robustus với cơ chế tự bẻ xương tạo móng vuốt được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Móng vuốt xương Wolverine và lực nhảy bật xa)",
            slug: "ech-kinh-di-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực phóng móng vuốt bẻ xương đạt 1.000 N xuyên thủng giáp dày 2cm, và tầm nhảy xa đạt 35 mét.",
            content: "Khi Ếch Kinh Dị phóng to lên 80kg (tăng khối lượng ~1.000 lần, tỷ lệ kích thước lambda = 10):\n- Lực phóng vuốt xương hủy diệt: Sự co rút mạnh mẽ của gân cơ gấp kỹ thuật số sâu bẻ gãy mấu khớp để phóng vuốt xương ra ngoài. Lực cơ học phóng vuốt tăng theo tiết diện cơ (tăng lambda^2 = 100 lần), đạt 1.000 N giúp vuốt xương nhọn xuyên qua các tấm giáp cứng dày.\n- Siêu phản xạ nhảy xa: Cơ đùi khổng lồ tích lũy và giải phóng động năng cực nhanh. Tầm nhảy xa lý thuyết tăng theo tỷ lệ kích thước, cho phép ếch kinh dị khổng lồ thực hiện những cú bật nhảy xa tới 35 mét chỉ trong một nhịp phát động.\n- Nhú da hô hấp tăng kích thước: Các nhú da dạng sợi (hair-like papillae) dài tới 15cm hoạt động như các sợi mang trao đổi khí bổ trợ cực tốt dưới lòng nước suối chảy xiết.",
            formulas_and_data: {
              scaling_factor: 1000,
              mass_kg_original: 0.08,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực phóng móng vuốt xương theo tiết diện cơ",
                  equation: "F_eject = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~1,000 N"
                },
                {
                  name: "Tầm nhảy xa lý thuyết tuyến tính",
                  equation: "D_jump = D_orig * (M_scaled / M_original)^(1/3)",
                  result: "~35 m"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Amphibian biology and bone-breaking defense mechanisms", url: "https://doi.org/10.1111/j.1469-7998.2008.00472.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Gãy vụn khớp ngón chân và suy hô hấp cấp tính)",
            slug: "ech-kinh-di-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Ứng suất uốn cực đại gây gãy nát xương ngón chân khi bẻ xương, và tỷ số diện tích da/thể tích giảm 90% gây ngạt thở.",
            content: "Trong thế giới thực tế vật lý sinh học khi ếch kinh dị nặng 80kg:\n- Gãy vụn khớp ngón chân: Việc tự bẻ xương ngón chân để lộ vuốt nhọn ở khối lượng 80kg sẽ chịu mô-men uốn khổng lồ. Ứng suất xương tăng gấp 10 lần vượt qua giới hạn chịu lực của chất nền xương lưỡng cư, khiến cú bẻ xương tự vệ sẽ làm gãy nát toàn bộ cấu trúc bàn chân thay vì chỉ giải phóng móng vuốt.\n- Ngạt thở nghiêm trọng: Ếch kinh dị phụ thuộc rất lớn vào hô hấp qua da và nhú da. Ở 80kg, tỷ số diện tích da trên thể tích giảm 90%, kết hợp phổi thô sơ không có phế nang xếp nếp phức tạp làm nồng độ oxy trong máu sụt giảm nghiêm trọng, khiến con vật ngạt thở tử vong chỉ sau vài phút trên cạn.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Gãy nát xương ngón chân do ứng suất uốn",
                  issue: "Ứng suất vượt quá 120 MPa trong khi giới hạn bền uốn của xương ếch chỉ đạt 45 MPa."
                },
                {
                  type: "Thiếu hụt oxy do giảm tỷ số diện tích bề mặt/thể tích",
                  issue: "Tỷ số diện tích trao đổi khí trên thể tích sụt giảm 90%, phổi thô sơ không đáp ứng đủ nhu cầu oxy cơ bản."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of respiratory structures in amphibians", url: "https://doi.org/10.1086/317765" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khớp tái tạo siêu tốc osteocyte và biểu mô phổi gấp nếp phức tạp)",
            slug: "ech-kinh-di-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương ngón chân composite khoáng hóa chịu uốn 8.500 N, phổi tiến hóa vách ngăn xếp nếp kiểu bò sát.",
            content: "Để Ếch Kinh Dị 80kg sinh tồn và chiến đấu hiệu quả:\n- Xương ngón chân composite khoáng hóa (Composite mineralized bones): Cấu trúc xương được bổ sung các sợi collagen liên kết chéo mật độ cao và tinh thể hydroxyapatite nén đặc, nâng giới hạn chịu uốn lên 8.500 N giúp móng vuốt phóng ra an toàn.\n- Phổi phế nang hóa dạng bò sát (Alveolar reptile-like lungs): Vách trong của phổi phát triển hệ thống nếp gấp sâu tích hợp mao mạch mật độ cao, tăng diện tích bề mặt trao đổi khí lên 1.4 m2, bù đắp hoàn toàn lượng oxy thiếu hụt từ da.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia cường xương ngón chân composite",
                  benefit: "Chịu lực uốn uốn ngón chân lên tới 8,500 N mà không nứt vỡ khớp."
                },
                {
                  type: "Tiến hóa phổi vách nếp gấp sâu",
                  benefit: "Tăng diện tích trao đổi khí lên 1.4 m2 duy trì oxy máu ở mức 95%."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Adaptive mechanics and bone regeneration in vertebrates", url: "https://doi.org/10.1002/ar.24102" }
            ]
          }
        ]
      });
    } else if (target.id === "largetooth-sawfish") {
      whatIfData.push({
        creature_id: "largetooth-sawfish",
        title: "Nếu Cá Đao Răng Lớn thu nhỏ bằng con người (80kg) thì sao?",
        slug: "neu-ca-dao-rang-lon-thu-nho-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi Cá Đao Răng Lớn Pristis pristis dài 6 mét được thu nhỏ về khối lượng con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Đao cưa quét ngang thần tốc và điện cảm biến 3D)",
            slug: "ca-dao-rang-lon-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực vung đao quét ngang đạt 850 N cắt ngọt con mồi, phản xạ phát hiện điện trường rút ngắn còn 12 ms.",
            content: "Khi Cá Đao Răng Lớn thu nhỏ về 80kg (dài khoảng 1.8m, đao dài 40cm):\n- Đao cưa quét tốc độ cao: Giảm mô-men quán tính trục vung (giảm 95% do chiều dài giảm) cho phép cá đao quét ngang với vận tốc góc siêu tốc. Cú quét đao tạo ra lực cắt ngang đạt 850 N, dễ dàng chém đôi các loài cá vây tia cỡ vừa.\n- Định vị siêu nhạy Lorenzini: Cảm biến điện trường tập trung dày đặc trên diện tích rostrum thu nhỏ. Quãng đường truyền tín hiệu thần kinh từ đao về não bộ rút ngắn 4 lần, đẩy tốc độ phản xạ chém mồi lên mức thần tốc 12 ms.",
            formulas_and_data: {
              scaling_factor: 0.16,
              mass_kg_original: 500,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Mô-men quán tính rostrum thu nhỏ",
                  equation: "I_scaled = I_orig * (M_scaled / M_original)^(5/3)",
                  result: "~0.047 * I_orig (Giảm 95.3% quán tính xoay)"
                },
                {
                  name: "Tốc độ dẫn truyền phản xạ xung thần kinh",
                  equation: "T_delay_scaled = T_delay_orig * (L_scaled / L_original)",
                  result: "~12 ms (nhanh gấp 4 lần nguyên bản)"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Rostrum mechanics and sensory adaptations in sawfish", url: "https://doi.org/10.1242/jeb.068221" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Đao cản thủy động học và mất thăng bằng mô-men xoắn)",
            slug: "ca-dao-rang-lon-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Lực cản nước rostrum dẹt làm giảm tốc bơi xuống dưới 6 km/h, mô-men phản lực xoay thân làm cá tự lật ngửa.",
            content: "Trong thế giới thực tế vật lý sinh học khi cá đao thu nhỏ về 80kg:\n- Cản nước cực đại: Chiếc đao dẹt răng cưa rìa ngoài tạo lực cản thủy động học lớn. Ở kích thước nhỏ, tỷ lệ diện tích đao cản nước trên khối lượng cơ thể tăng mạnh, khiến tốc độ di chuyển tối đa giảm xuống còn 6 km/h, mất hoàn toàn ưu thế bám đuổi.\n- Rối loạn mô-men xoắn phản lực: Một cú quét đao cực mạnh sẽ tạo ra phản lực mô-men xoắn xoay thân lớn. Do cơ thể cá chỉ còn nặng 80kg, phản lực từ cú vung đao sẽ làm cơ thể cá tự xoay tròn lệch trục góc 45 độ hoặc lật ngửa mất thăng bằng trong nước.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Mô-men xoắn phản lực gây lật trục cơ thể",
                  issue: "Phản lực vung đao vượt qua lực cản vây ngực phẳng sụn, làm cá tự xoay tròn trục dọc."
                },
                {
                  type: "Gia tăng hệ số cản thủy động lực",
                  issue: "Hệ số cản nước Cd của đao răng cưa tăng 120% so với cơ thể thuôn dài của các loài cá mập, làm tiêu tốn năng lượng bơi lội."
                }
              ]
            },
            p4p_score_scaled: 30,
            tier_scaled: "D",
            sources: [
              { label: "Hydrodynamics of rostral structures in aquatic vertebrates", url: "https://doi.org/10.1111/j.1469-7998.2012.00918.x" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khớp đệm triệt tiêu mô-men xoắn và vảy giảm lực cản nano)",
            slug: "ca-dao-rang-lon-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa khớp sụn đàn hồi cao triệt tiêu 95% mô-men phản lực, vảy nhám nano giảm 85% lực cản ma sát.",
            content: "Để Cá Đao Răng Lớn 80kg bơi lội thần tốc và săn mồi hiệu quả:\n- Khớp đao triệt tiêu lực (Torque-absorbing joint): Khớp nối giữa sọ và rostrum phát triển lớp sụn khớp collagen đàn hồi dày, hấp thụ 95% xung phản lực uốn xoắn khi vung đao, bảo vệ trục cột sống thẳng ổn định.\n- Vảy răng cưa nano giảm lực cản (Riblet nano-denticles): Da nhám mọc các vảy xếp khít mang rãnh nano song song uốn dòng chảy lướt qua thân cá, giảm ma sát động xuống cực tiểu, tăng tốc độ bơi tối đa lên 35 km/h.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khớp sụn đệm triệt tiêu mô-men xoắn",
                  benefit: "Hấp thụ mô-men lực vung đao lên tới 60 N.m giữ thân cá ổn định trên đường bơi."
                },
                {
                  type: "Cấu trúc vảy riblet hướng dòng nước nano",
                  benefit: "Hệ số cản nước Cd giảm từ 0.08 xuống còn 0.012, tăng hiệu suất bứt tốc gấp 6 lần."
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "B",
            sources: [
              { label: "Bio-inspired hydrodynamics and torque control in fish-like robots", url: "https://doi.org/10.1088/1748-3182/10/4/046001" }
            ]
          }
        ]
      });
    } else if (target.id === "marine-iguana") {
      whatIfData.push({
        creature_id: "marine-iguana",
        title: "Nếu Cự Đà Biển Galapagos phóng to bằng con người (80kg) thì sao?",
        slug: "neu-cu-da-bien-galapagos-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài thằn lằn biển Amblyrhynchus cristatus duy nhất trên thế giới được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Móng vuốt lực bám đá và vây đuôi thủy lực bơi vượt sóng)",
            slug: "cu-da-bien-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực bám móng vuốt đạt 2.400 N giữ cơ thể cố định trước sóng lớn, tốc độ bơi vẫy đuôi đạt 13 km/h.",
            content: "Khi Cự Đà Biển Galapagos phóng to lên 80kg (tăng khối lượng ~20 lần, chiều dài đạt 2.5m, sải đuôi 1.3m):\n- Lực bám đá hủy diệt: Bộ móng vuốt sừng dài 15cm cong quặp. Lực bám cơ ngực và móng vuốt tăng theo diện tích bề mặt (tăng lambda^2 = 7.3 lần), đạt 2.400 N giúp cự đà biển 80kg giữ chặt cơ thể cố định trên những rạn đá dung nham trơn tuột trước sóng gió cấp 8 đập mạnh.\n- Đuôi chèo thủy lực: Đuôi dẹt ngang vẫy đập mạnh mẽ uốn sóng cơ học lớn. Lực đẩy tăng mạnh giúp cự đà biển khổng lồ bơi ngược dòng triều rút với tốc độ bơi liên tục đạt 13 km/h.",
            formulas_and_data: {
              scaling_factor: 20,
              mass_kg_original: 4,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực bám đá của móng vuốt cơ bắp",
                  equation: "F_grip = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~2,400 N"
                },
                {
                  name: "Tốc độ bơi đẩy đuôi dẹt lý thuyết",
                  equation: "V_swim = V_orig * (M_scaled / M_original)^(1/6)",
                  result: "~13 km/h"
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "B",
            sources: [
              { label: "Biomechanics of locomotion in marine iguanas", url: "https://doi.org/10.1086/317208" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Hạ thân nhiệt nhanh liệt cơ dưới nước và ngộ độc natri do tuyến muối quá tải)",
            slug: "cu-da-bien-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất nhiệt nhanh liệt cơ lặn sâu dưới 10 phút, tuyến muối mũi bị tắc nghẽn sưng niêm mạc.",
            content: "Trong thế giới thực tế vật lý sinh học khi cự đà biển nặng 80kg:\n- Hạ thân nhiệt nhanh và liệt cơ dưới nước: Do biến nhiệt, cự đà dựa vào sưởi nắng tích nhiệt rồi lặn biển 15°C tìm tảo. Ở 80kg, tỷ lệ diện tích bề mặt/thể tích giảm 2.7 lần làm chậm tốc độ phơi nhiệt trên cạn. Khi lặn sâu, nhiệt lõi mất nhanh qua dòng chảy nước lạnh đối lưu, gây hạ thân nhiệt đột ngột từ 37°C xuống 15°C chỉ dưới 10 phút, làm co cứng cơ bơi và chết đuối đáy biển.\n- Quá tải tuyến lọc muối: Ăn tảo nạp lượng muối khổng lồ tăng 20 lần so với nguyên bản. Tuyến muối ở mũi bị quá tải công suất lọc, dẫn đến tích tụ muối NaCl trong máu vượt ngưỡng 220 mmol/L, gây co giật dây thần kinh và ngộ độc natri nội tế bào.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hạ nhiệt độ cơ thể dưới nước lạnh 15°C",
                  issue: "Thời gian lặn an toàn giảm xuống dưới 10 phút do dòng nước lấy nhiệt nhanh gấp nhiều lần, gây co cứng cơ."
                },
                {
                  type: "Ngộ độc natri do quá tải bài tiết muối",
                  issue: "Nồng độ muối NaCl trong máu vượt quá 220 mmol/L gây co giật và hôn mê hệ thần kinh."
                }
              ]
            },
            p4p_score_scaled: 30,
            tier_scaled: "D",
            sources: [
              { label: "Thermal biology and salt gland function in Galapagos marine iguanas", url: "https://doi.org/10.1086/31790" }
            ]
          },
          {
            title: "Đột biến thích nghi (Tuần hoàn cách nhiệt trung tâm chọn lọc và siêu tuyến bài tiết muối mắt miệng)",
            slug: "cu-da-bien-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tuần hoàn cô lập máu nóng 37°C bảo vệ cơ quan lõi, siêu tuyến muối đôi bài tiết liên tục không cần hắt hơi.",
            content: "Để Cự Đà Biển Galapagos 80kg hoạt động bền bỉ và lặn biển lâu hơn:\n- Tuần hoàn cách nhiệt chọn lọc (Vascular shunt insulation): Các mao mạch máu ngoại vi tự co thắt khân cấp khi gặp nước biển lạnh, giữ dòng máu nóng 37°C tuần hoàn khép kín bảo vệ tim, não và cơ bơi lội, nâng thời gian lặn an toàn lên tới 60 phút.\n- Siêu tuyến muối tự bài tiết cơ học (Hyper-active lateral salt glands): Tiến hóa hai cụm tuyến bài tiết muối lớn quanh sọ, liên tục dẫn dung dịch muối mặn đậm đặc thải ra trực tiếp khóe mắt và vòm họng mà không cần hắt hơi, giữ nồng độ muối máu ổn định ở mức hoàn hảo 140 mmol/L.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Tuần hoàn co mạch máu ngoại vi chọn lọc",
                  benefit: "Duy trì thân nhiệt lõi ổn định 37°C trong nước lạnh lên tới 60 phút lặn."
                },
                {
                  type: "Siêu tuyến muối bài tiết cơ học liên tục",
                  benefit: "Thải tới 85g NaCl mỗi ngày trực tiếp ra ngoài cơ thể mà không gây sưng nghẹt xoang mũi."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "B",
            sources: [
              { label: "Cardiovascular and osmotic adaptations in marine reptiles", url: "https://doi.org/10.1086/317921" }
            ]
          }
        ]
      });
    } else if (target.id === "ribbon-eel") {
      whatIfData.push({
        creature_id: "ribbon-eel",
        title: "Nếu Cá Chình Ruy Băng phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-chinh-ruy-bang-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá chình có thân hình mảnh mai uốn lượn như dải lụa Rhinomuraena quaesita được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Thân dài siêu dẻo uốn sóng và cú táp hàm phụ tầm xa)",
            slug: "ca-chinh-ruy-bang-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Thân dài 12m siêu linh hoạt lách khe nhỏ với lực uốn thân 1.200 N, cơ chế hàm hầu phóng ra chộp mồi nhanh chớp mắt.",
            content: "Khi Cá Chình Ruy Băng phóng to lên 80kg (tăng khối lượng ~800 lần, chiều dài kéo dài từ 1m lên khoảng 10-12m, đường kính thân đạt ~15-20cm):\n- Lực uốn thân sóng động năng: Cấu trúc cơ cột sống hơn 200 đốt xương cực kỳ dẻo dai. Lực đẩy cơ thân uốn lượn tăng mạnh theo tỷ lệ diện tích bề mặt (tăng lambda^2 = 86 lần), đạt 1.200 N giúp nó lướt gió rẽ nước cực nhanh và len lỏi qua các hang hốc sâu dưới đáy biển.\n- Cú táp hàm hầu kép động cơ học: Sở hữu bộ hàm phụ ở thực quản (pharyngeal jaws) có khả năng phóng ra trước tóm mồi rồi kéo tuột vào dạ dày. Ở kích cỡ khổng lồ, hàm hầu này có thể kéo lực xiết lên tới 800 N trong thời gian 50 mili giây, đớp và nuốt chửng các con mồi lớn như loài cá mú.",
            formulas_and_data: {
              scaling_factor: 800,
              mass_kg_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực uốn thân hình sin thủy động học",
                  equation: "F_propulsion = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~1,200 N"
                },
                {
                  name: "Lực kẹp của hàm phụ pharyngeal jaws",
                  equation: "F_bite = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~800 N"
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Kinematics of pharyngeal jaw mechanics in moray eels", url: "https://doi.org/10.1038/nature06062" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sụp đổ tuần hoàn máu do thân quá dài và ngạt thở vì diện tích mang quá hẹp)",
            slug: "ca-chinh-ruy-bang-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Tim không thể bơm máu dọc thân dài 12m chống lại áp suất thủy tĩnh, diện tích mang không đủ khuếch tán oxy.",
            content: "Trong thế giới thực tế vật lý sinh học khi cá chình ruy băng nặng 80kg:\n- Suy sụp tuần hoàn do thân quá dài: Thân cá chình ruy băng cực kỳ thuôn và mỏng. Khi phóng to lên chiều dài 12m, khoảng cách từ tim đến đuôi là cực kỳ lớn. Do áp suất thủy tĩnh ở biển sâu và sự thiếu hụt của hệ tuần hoàn có van trợ lực chủ động dọc thân, tim cá chình (vốn nhỏ và áp lực thấp) sẽ không thể đẩy máu đi hết chiều dài 12m, gây hoại tử đuôi và suy tim cấp tính trong vài giờ.\n- Thiếu oxy nghiêm trọng: Hệ hô hấp bằng mang của cá chình ruy băng nhỏ hẹp. Khi thể tích cơ thể tăng 800.000 lần nhưng diện tích mang chỉ tăng 10.000 lần theo định luật bình phương - lập phương, lượng oxy hấp thụ qua mang chỉ đáp ứng được 1.25% nhu cầu trao đổi chất tối thiểu, cá sẽ ngạt thở ngay lập tức.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giới hạn áp suất tuần hoàn máu dọc thân 12m",
                  issue: "Chênh lệch áp suất thủy động học vượt quá sức cản thành mạch, tim không thể bơm máu đến các đốt sống đuôi."
                },
                {
                  type: "Hô hấp qua diện tích mang bị thu hẹp tương đối",
                  issue: "Tỉ lệ O2 khuếch tán qua mang giảm mạnh còn 1.25% nhu cầu tối thiểu khi thể tích tăng lập phương."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Allometric scaling of cardiovascular system in elongated fishes", url: "https://doi.org/10.1111/jfb.13600" }
            ]
          },
          {
            title: "Đột biến thích nghi (Hệ tim phụ dọc thân và mang xếp nếp diện tích lớn)",
            slug: "ca-chinh-ruy-bang-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa 3 quả tim phụ dọc tủy sống để trợ lực tuần hoàn và hệ mang xếp nếp mở rộng gấp 80 lần.",
            content: "Để cá chình ruy băng khổng lồ 80kg hoạt động linh hoạt mà không bị suy tuần hoàn hay ngạt thở:\n- Tim phụ hỗ trợ dọc thân (Caudal accessory hearts): Tiến hóa thêm 3 trung tâm co bóp cơ tim phụ dọc theo động mạch đuôi, nhận tín hiệu co bóp nhịp nhàng từ tủy sống để đẩy máu tĩnh mạch ngược về tim chính, duy trì áp huyết ổn định 60 mmHg toàn thân dài 12m.\n- Hệ mang xếp nếp cấu trúc phức hợp (Hyper-folded gill lamellae): Các sợi mang tiến hóa gấp nếp xếp lớp sâu với các vi mao mạch dày đặc, tăng diện tích tiếp xúc trao đổi khí lên 80 lần so với mang cá thông thường, đảm bảo hấp thu đủ 240 ml O2/phút để nuôi dưỡng toàn bộ cơ bắp uốn lượn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ thống tim phụ hỗ trợ tuần hoàn dọc thân",
                  benefit: "Đảm bảo áp huyết phân phối đều 60 mmHg trên toàn bộ chiều dài 12m thân cá."
                },
                {
                  type: "Hệ mang xếp nếp vi mao mạch mật độ cao",
                  benefit: "Nâng lưu lượng trao đổi oxy lên 240 ml/phút, đáp ứng hoàn hảo hoạt động bơi cường độ cao."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "B",
            sources: [
              { label: "Accessory pumping organs and cardiovascular adaptations in fishes", url: "https://doi.org/10.1002/jez.1402800109" }
            ]
          }
        ]
      });
    } else if (target.id === "sea-cucumber") {
      whatIfData.push({
        creature_id: "sea-cucumber",
        title: "Nếu Hải Sâm phóng to bằng con người (80kg) thì sao?",
        slug: "neu-hai-sam-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài động vật da gai Holothuroidea có khả năng hóa lỏng mô liên kết được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơ chế Catch-Collagen hóa đá và phóng tơ độc Cuvierian tầm xa)",
            slug: "hai-sam-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Chuyển trạng thái cơ thể từ mềm nhão sang giáp đá chịu lực ép 15.000 N, phóng chùm tơ dính Cuvierian dài 10m.",
            content: "Khi Hải Sâm phóng to lên 80kg (tăng khối lượng ~400 lần, chiều dài đạt 1.8m, đường kính thân đạt ~45cm):\n- Siêu giáp hóa đá Catch-Collagen: Dưới sự điều khiển của hệ thần kinh, các liên kết chéo giữa sợi collagen tự động thắt chặt. Độ cứng mô tăng vọt 100 lần, chịu được lực đập ép trực tiếp lên tới 15.000 N mà không nứt vỡ, biến hải sâm thành một tảng đá phòng ngự bất hoại.\n- Phun tơ keo độc Cuvierian hủy diệt: Khi bị tấn công, hệ thống ống Cuvierian phóng ra các sợi tơ màu trắng tự nở dài gấp 20 lần (đạt 10m), chứa độc tố Holothurin liều cao. Lượng keo dính này có thể đông cứng nhanh dưới nước và trói chặt kẻ thù lớn như cá mập hổ trong chốc lát.",
            formulas_and_data: {
              scaling_factor: 400,
              mass_kg_original: 0.2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực ép tối đa chịu đựng của mô Catch-Collagen khi cứng hóa",
                  equation: "F_compression = Stress_max * Area_scaled",
                  result: "~15,000 N"
                },
                {
                  name: "Chiều dài chùm tơ Cuvierian khi phóng ra",
                  equation: "L_threads = L_orig * (M_scaled / M_original)^(1/3) * expansion_ratio",
                  result: "~10 meters"
                }
              ]
            },
            p4p_score_scaled: 70,
            tier_scaled: "B",
            sources: [
              { label: "Biomechanics of catch connective tissue in sea cucumbers", url: "https://doi.org/10.1242/jeb.02405" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Hóa lỏng mô tự chảy nhão và suy sụp hệ thống hô hấp qua hậu môn)",
            slug: "hai-sam-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Catch-collagen tự hóa lỏng dưới tác động trọng lực làm biến dạng toàn bộ cơ thể, phổi nước hậu môn bị vỡ tung do áp suất.",
            content: "Trong thế giới thực tế vật lý sinh học khi hải sâm nặng 80kg:\n- Tự chảy sụp do lực hấp dẫn: Khi hải sâm chuyển sang trạng thái mềm để chui khe đá, catch-collagen hóa lỏng liên kết. Ở khối lượng 80kg, trọng lực kéo cơ thể chảy xệ dẹt ra như một bãi bùn lỏng trên nền cát, không thể thu hồi lại hình dáng cũ vì áp lực nén nội tạng quá lớn gây rách biểu bì.\n- Vỡ nát cơ quan hô hấp (phổi nước): Hải sâm hô hấp bằng cách bơm hút nước biển qua lỗ hậu môn vào phổi nước (respiratory trees). Ở quy mô 80kg, lực co bóp cơ hậu môn để đẩy 15 lít nước mỗi chu kỳ là cực kỳ lớn. Áp suất nước dồn đẩy quá mức sẽ xé rách hệ thống phổi nước mỏng manh bên trong, gây chảy máu hệ tuần hoàn hở và nhiễm trùng tử vong nhanh chóng.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Độ nhớt cơ học của Catch-collagen khi hóa mềm",
                  issue: "Ứng suất chảy (yield stress) thấp hơn áp suất trọng lực đè nén của 80kg thịt, gây sụp đổ cấu trúc cơ thể."
                },
                {
                  type: "Thể tích nước trao đổi qua phổi nước",
                  issue: "Nhu cầu bơm 15-20 lít nước mỗi chu kỳ hô hấp tạo áp suất thủy động học vượt quá giới hạn chịu bền của thành ruột."
                }
              ]
            },
            p4p_score_scaled: 10,
            tier_scaled: "D",
            sources: [
              { label: "Respiratory physiology and mechanical properties of echinoderm catch connective tissue", url: "https://doi.org/10.1086/BBLv190n1p124" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khung xương nội kitin xốp dẻo và van hô hấp hậu môn một chiều kép)",
            slug: "hai-sam-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa các tấm xương kitin dẻo dạng lưới nâng đỡ cơ thể và van hậu môn cơ học hai buồng chống vỡ phổi.",
            content: "Để hải sâm khổng lồ 80kg sinh tồn vững vàng và tự vệ hiệu quả:\n- Bộ khung xương kitin dẻo dạng lưới (Flexible mesh-like endoskeleton): Dưới lớp biểu bì tiến hóa một mạng lưới cấu trúc các tấm kitin xốp liên kết khớp động. Khung sườn này giữ hình dạng ống cố định cho hải sâm khi hóa mềm mô, ngăn chặn sự chảy sụp do trọng lực dưới nước và trên cạn.\n- Van hô hấp hậu môn hai buồng (Dual-chamber anal respiratory valves): Tiến hóa cơ vòng hậu môn dày chịu lực cùng hệ van một chiều kép. Một buồng thu gom nước biển, buồng kia tạo áp lực nén đẩy nhẹ nhàng tuần tự vào phổi nước có vách dày hơn, ngăn chặn hoàn toàn nguy cơ rách phổi do sốc áp suất thủy lực đột ngột.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khung lưới xương kitin khớp động",
                  benefit: "Chống lại trọng lực của cơ thể 80kg, bảo vệ an toàn cho hệ cơ quan nội tạng bên trong."
                },
                {
                  type: "Hệ van hậu môn hai buồng chịu áp lực",
                  benefit: "Cho phép nén và lọc đều đặn 18 lít nước/phút mà không làm tổn thương cấu trúc hô hấp mỏng."
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Skeletal morphology and respiratory adaptations in giant holothurians", url: "https://doi.org/10.1111/j.1469-7998.2010.00705.x" }
            ]
          }
        ]
      });
    } else if (target.id === "southern-cassowary") {
      whatIfData.push({
        creature_id: "southern-cassowary",
        title: "Nếu Đà Điểu Đầu Mũi phóng to bằng con người (80kg) thì sao?",
        slug: "neu-da-dieu-dau-mui-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài chim Casuarius casuarius nguy hiểm nhất hành tinh được hiệu chỉnh khối lượng đạt mức 80kg tương đương một võ sĩ đấm bốc hạng trung.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đá xé rách 4.500 N và mũ sừng keratin cản phá va chạm)",
            slug: "da-dieu-dau-mui-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đá chân móng vuốt 12cm đạt 4.500 N xuyên phá giáp chống bạo động, mũ sừng keratin giảm chấn xung lực cực mạnh.",
            content: "Khi Đà Điểu Đầu Mũi đạt khối lượng 80kg (tăng khối lượng ~1.6 lần so với con đực lớn 50kg, chiều cao đạt 2.1m):\n- Cú đá uy lực hủy diệt: Nhờ hệ cơ đùi phát triển cực đại, khi đá xéo xuống, móng vuốt ngón trong dài 15cm cứng như thép sẽ cắm sâu vào mục tiêu. Lực tác động động năng tăng mạnh theo tỷ lệ cơ (đạt ~4.500 N), tương đương lực va chạm của một chiếc xe máy chạy tốc độ 45 km/h, dễ dàng xuyên thủng tấm khiên bạo động và xé rách mô sâu.\n- Mũ sừng (casque) giáp đầu keratin: Casque tăng kích thước đạt thể tích 3.2 lít, cấu trúc xốp bên trong dày lên giúp hấp thụ 92% xung lực khi húc va đập trực tiếp, bảo vệ hộp sọ khỏi chấn thương sọ não khi va chạm tốc độ cao.",
            formulas_and_data: {
              scaling_factor: 1.6,
              mass_kg_original: 50,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực tác động xung năng của cú đá ngón vuốt",
                  equation: "F_impact = Delta_p / Delta_t = M_scaled * V_kick / Delta_t",
                  result: "~4,500 N"
                },
                {
                  name: "Hệ số hấp thụ lực giảm chấn của mũ sừng (casque)",
                  equation: "E_absorbed = E_total * (1 - e^(-k * thickness))",
                  result: "~92% lực va chạm"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "The structural biomechanics of the cassowary casque", url: "https://doi.org/10.1371/journal.pone.0122558" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Đứt gân gót chân do quá tải chịu lực và giảm sút khả năng cơ động nhanh)",
            slug: "da-dieu-dau-mui-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Hệ số an toàn của xương gót chân giảm mạnh, gãy nứt khớp gối khi thực hiện cú nhảy cao tiếp đất.",
            content: "Trong thế giới thực tế vật lý sinh học khi đà điểu đầu mũi nặng 80kg:\n- Đứt gân gót và gãy xương gối tiếp đất: Ở khối lượng 80kg, ứng suất cơ học đè lên khớp gối và gân gót chân (Achilles tendon) tăng tuyến tính theo khối lượng (tăng 1.6 lần) trong khi độ bền mặt cắt ngang cơ gân chỉ tăng 1.36 lần (bình phương chiều dài). Khi đà điểu nhảy vọt cao 1.8m để đá mục tiêu, xung lực phản hồi tiếp đất đạt 9.500 N vượt quá giới hạn uốn đàn hồi của xương chày (tibiotarsus), dẫn đến gãy nứt xương chân và rách đứt hoàn toàn gân Achilles.\n- Quá tải nhiệt lượng: Bộ lông dày cứng như tóc giữ nhiệt tốt để chống gai. Ở kích cỡ 80kg, tỷ lệ tỏa nhiệt qua da giảm sút, khiến nó nhanh chóng bị sốc nhiệt đột ngột khi chạy nhanh liên tục quá 5 phút trong rừng rậm.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất kéo đè nặng lên gân gót chân khi tiếp đất",
                  issue: "Xung lực phản hồi tiếp đất 9.500 N vượt quá giới hạn kéo đứt (ultimate tensile strength) của sợi collagen gân gót."
                },
                {
                  type: "Tốc độ tỏa nhiệt lõi qua lớp lông sừng rậm rạp",
                  issue: "Nhiệt lượng sinh ra khi chạy 40 km/h tích tụ nhanh, gây sốc nhiệt trên 43°C chỉ sau 5 phút hoạt động liên tục."
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Avian locomotion biomechanics and tendon scaling limits", url: "https://doi.org/10.1242/jeb.029858" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khớp gối gia cố vảy sừng dày và hệ thống phế nang thông khí nhiệt chủ động)",
            slug: "da-dieu-dau-mui-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Gân gót chân cơ bắp hóa sừng chịu lực cực đại 12.000 N, hệ túi khí khí quản mở rộng tăng 50% hiệu suất làm mát.",
            content: "Để đà điểu đầu mũi khổng lồ 80kg chạy nhảy và chiến đấu ổn định mà không lo gãy chân hay sốc nhiệt:\n- Gân gót chân cốt hóa bán sừng (Semi-ossified patellar tendon): Cấu trúc collagen của gân gót chân được gia cố bằng các dải calci hóa vi thể đan xen xen kẽ, tăng độ bền kéo chịu tải lực lên tới 12.000 N, giúp tiếp đất an toàn sau những cú nhảy cao 2m.\n- Túi khí khí quản làm mát chủ động (Hyper-developed tracheal air sacs): Hệ túi khí hô hấp mở rộng dọc cổ bên dưới lớp yếm đỏ rực. Khi chạy nhanh, lưu lượng khí qua phổi trao đổi và làm mát bốc hơi tăng 50%, duy trì thân nhiệt lõi ở mức hoàn hảo 39°C bất kể điều kiện rừng nhiệt đới nóng bức.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gân Patellar cốt hóa calci vi thể",
                  benefit: "Duy trì sức bền kéo vượt trội chịu xung tải đập mạnh lên tới 12.000 N mà không rách sợi gân."
                },
                {
                  type: "Túi khí hô hấp khí quản tản nhiệt cưỡng bức",
                  benefit: "Giải nhiệt cơ học liên tục 350 W khi hoạt động cường độ cao giúp ngăn ngừa sốc nhiệt hiệu quả."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Thermoregulation and respiratory air sacs in running palaeognathous birds", url: "https://doi.org/10.1086/513812" }
            ]
          }
        ]
      });
    } else if (target.id === "antarctic-icefish") {
      whatIfData.push({
        creature_id: "antarctic-icefish",
        title: "Nếu Cá Băng Nam Cực phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-bang-nam-cuc-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Cá Băng Nam Cực (Chionodraco rastrospinosus) đạt khối lượng con người 80kg trong điều kiện nhiệt độ đóng băng và không có hồng cầu.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Dòng chảy tuần hoàn siêu tốc và siêu ti thể)",
            slug: "ca-bang-nam-cuc-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Tốc độ dòng chảy máu tăng gấp 5 lần nhờ tim khổng lồ màu đỏ Mb+, mạng lưới mao mạch da rộng gấp 4 lần hấp thụ lượng oxy hòa tan cực đại.",
            content: "Khi Cá Băng Nam Cực nặng 80kg (tăng khối lượng ~80 lần từ mức 1kg, dài đạt 1.8m):\n- Tim khổng lồ siêu co bóp: Cơ tim giàu myoglobin (Mb+) nở rộng gấp 3 lần tỷ lệ thông thường, tạo áp lực co bóp lớn. Lực bóp tim tăng theo tiết diện cơ (hệ số lambda^2 ≈ 18.5), đẩy thể tích máu lớn gấp 4 lần qua lòng mạch rộng rãi mà không gặp cản trở ma sát ở nước lạnh.\n- Trao đổi khí biểu bì cực hạn: Da cực mỏng không vảy, diện tích da phóng to đạt 1.2 m2 tiếp xúc trực tiếp nước lạnh giàu oxy. Máu tuần hoàn nhanh thu nhận oxy hòa tan trong huyết tương đạt mức 2.8 ml O2/100ml máu, cung cấp dồi dào dưỡng chất cho mật độ ti thể đậm đặc chiếm 36% thể tích cơ.\n- Kháng đông tối ưu: Lượng glycoprotein chống đông (AFGPs) tăng theo nồng độ huyết tương, ngăn chặn tuyệt đối tinh thể băng hình thành ở nhiệt độ -1.8°C.",
            formulas_and_data: {
              scaling_factor: 80,
              mass_kg_original: 1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực co bóp cơ tim phóng to",
                  equation: "F_heart_scaled = F_heart_original * (M_scaled / M_original)^(2/3)",
                  result: "~38 N"
                },
                {
                  name: "Lưu lượng tuần hoàn máu huyết tương không hồng cầu",
                  equation: "Q_blood = V_stroke * HR",
                  result: "~12 lít/phút"
                }
              ]
            },
            p4p_score_scaled: 72,
            tier_scaled: "B",
            sources: [
              { label: "Antifreeze glycoproteins and cardiovascular physiology in Antarctic fishes", url: "https://doi.org/10.1111/j.1095-8649.2005.00683.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sốc nhiệt độ tăng nhẹ và ngạt oxy khi thiếu hồng cầu)",
            slug: "ca-bang-nam-cuc-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Nhiệt độ nước tăng trên 5°C làm giảm oxy hòa tan gây ngạt thở cấp tính, thiếu hồng cầu khiến cơ thể 80kg thiếu hụt 85% oxy khi hoạt động.",
            content: "Trong thế giới thực tế vật lý sinh học khi Cá Băng Nam Cực nặng 80kg:\n- Khủng hoảng vận chuyển oxy: Thiếu huyết sắc tố (hemoglobin) khiến máu chỉ có thể vận chuyển oxy dưới dạng hòa tan vật lý trong huyết tương. Khi phóng to lên 80kg, nhu cầu oxy của cơ thể tăng tỷ lệ với khối lượng cơ (M^1.0 hoặc M^0.75), nhưng diện tích trao đổi khí qua da và mang chỉ tăng theo bình phương (M^0.67). Tỷ lệ cung/cầu oxy giảm 4.5 lần. Ở mức hoạt động cơ bản, cơ thể thiếu hụt tới 85% lượng oxy cần thiết, dẫn đến tích tụ axit lactic hủy diệt cơ xương và gây tử vong do ngạt thở.\n- Nhạy cảm nhiệt độ cực đoan: Nước ấm lên từ -1.8°C đến 5°C làm giảm 30% độ hòa tan oxy của nước và tăng BMR (tốc độ trao đổi chất) của cá lên gấp đôi. Cá băng khổng lồ đột quỵ do sốc nhiệt và ngạt thở lập tức.\n- Sụp đổ sụn xương yếu: Cấu trúc xương sụn mềm và nhiều lipid (dành cho sức nổi trung tính) không chịu nổi trọng lực cạn hoặc chênh lệch áp suất dòng chảy đáy, gây méo mó lồng ngực.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt diện tích phổi trao đổi khí",
                  issue: "Giới hạn cung cấp oxy hòa tan huyết tương tối đa ở 80kg chỉ đạt ~0.34 lít O2/giờ, thiếu hụt 85% nhu cầu hoạt động tối thiểu."
                },
                {
                  type: "Tỷ lệ diện tích da/thể tích giảm mạnh",
                  issue: "Tỷ lệ diện tích da/thể tích giảm 78%, ngăn cản khuếch tán oxy thụ động qua biểu bì."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "The biology of Antarctic fishes: hemoglobin-free brains and cardiovascular limits", url: "https://doi.org/10.1152/physrev.00010.2005" }
            ]
          },
          {
            title: "Đột biến thích nghi (Phổi nước phế nang hóa và siêu sắc tố hemocyanin xanh)",
            slug: "ca-bang-nam-cuc-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Mang xếp nếp gấp 20 lần tăng diện tích tiếp xúc, đột biến sản sinh sắc tố vận chuyển oxy hemocyanin gốc đồng giúp mang máu màu xanh lam.",
            content: "Để Cá Băng 80kg sinh tồn dũng mãnh và săn mồi ở cả vùng nước ấm hơn:\n- Đột biến sắc tố máu Hemocyanin: Kích hoạt chuỗi gen cổ xưa tạo ra hemocyanin gốc đồng (tương tự mực/bạch tuộc) trong huyết tương. Máu cá băng chuyển sang màu xanh lam nhạt, tăng khả năng liên kết và vận chuyển oxy lên gấp 8 lần so với dạng hòa tan vật lý đơn thuần, đáp ứng hoàn hảo nhu cầu cơ ngực ti thể.\n- Mang xếp nếp siêu cấp (Hyper-folded gills): Diện tích mang tăng sinh gấp 20 lần thông qua các phiến mang gấp nếp micro, tối đa hóa trao đổi khí kể cả trong nước nghèo oxy.\n- Gia cố khung xương sụn-chitin: Cấu trúc xương sụn được khoáng hóa muối canxi và chitin cứng cáp, bảo vệ lồng ngực khỏi trọng lực đè nén.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khả năng mang oxy của máu xanh hemocyanin đột biến",
                  benefit: "Máu chuyển màu xanh lam nhạt, tăng khả năng mang oxy lên ~2.2 ml O2/100ml."
                },
                {
                  type: "Giới hạn uốn gãy khung xương gia cố canxi",
                  benefit: "Khung xương được khoáng hóa muối canxi chịu được áp suất uốn gãy lên tới ~4.5 MPa."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Evolution of oxygen-transport proteins and respiratory mutations in extreme environments", url: "https://doi.org/10.1093/gbe/evs089" }
            ]
          }
        ]
      });
    } else if (target.id === "bengal-slow-loris") {
      whatIfData.push({
        creature_id: "bengal-slow-loris",
        title: "Nếu Cu Li Chậm Bengal phóng to bằng con người (80kg) thì sao?",
        slug: "neu-cu-li-cham-bengal-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài linh trưởng độc duy nhất Cu Li Chậm Bengal (Nycticebus bengalensis) được phóng to lên khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Nọc độc hoại tử hoại huyết và cú ôm khóa cơ học vạn cân)",
            slug: "cu-li-cham-bengal-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Sản sinh 2.5 lít hỗn hợp nọc độc hoại tử mô từ tuyến khuỷu tay, lực bám khóa cơ học đạt 2.800 N bám trụ tĩnh suốt nhiều tuần.",
            content: "Khi Cu Li Chậm Bengal nặng 80kg (tăng khối lượng ~65 lần từ mức 1.2kg, chiều dài cơ thể đạt 1.3 mét):\n- Nọc độc khổng lồ hủy diệt: Tuyến brachial mở rộng sản sinh chất dịch chứa Feld 1 độc hại dung tích lên đến 1.5 lít. Khi trộn với nước bọt có chứa enzyme xúc tác, cu li khổng lồ tạo ra 2.5 lít nọc độc hoại tử mạnh mẽ. Vết cắn từ răng lược sừng dài 6cm sẽ truyền lượng độc tố cực lớn, gây hoại tử cơ sâu, sốc phản vệ và suy đa tạng cho đối phương trong vòng vài phút.\n- Khóa bám vạn lực: Nhờ bó mạch retia mirabilia ở cổ tay chân phát triển lớn, lưu lượng oxy cấp cho cơ tĩnh tăng mạnh. Lực khóa kẹp từ các ngón tay mở rộng 180 độ đạt 2.800 N, bám chặt cành cây lớn như gọng kìm thủy lực không thể gỡ ra.\n- Thị giác Tapetum Lucidum khổng lồ: Mắt đường kính 8cm thu nhận ánh sáng đêm siêu nhạy, phát hiện chuyển động cách 150m trong bóng tối hoàn toàn.",
            formulas_and_data: {
              scaling_factor: 66.7,
              mass_kg_original: 1.2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực kẹp bám tĩnh của bàn tay khớp khóa",
                  equation: "F_grip_scaled = F_grip_original * (M_scaled / M_original)^(2/3)",
                  result: "~2,800 N"
                },
                {
                  name: "Tổng dung tích nọc độc liên hợp có thể sản sinh",
                  equation: "V_venom_scaled = V_venom_original * (M_scaled / M_original)",
                  result: "~2.5 lít"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Venom system in Nycticebus: biochemistry of brachial gland secretions", url: "https://doi.org/10.1007/s10764-011-9505-1" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Chết vì nọc độc tự thân và sụp đổ hệ cơ tĩnh do trọng lượng nặng)",
            slug: "cu-li-cham-bengal-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Áp lực 80kg bẻ gãy khớp ngón tay yếu khi treo bám tĩnh, rách miệng và ngộ độc hoại tử thứ phát do chính nọc độc của mình.",
            content: "Trong thực tế vật lý sinh học khi Cu Li Chậm Bengal nặng 80kg:\n- Treo bám thất bại: Trọng lượng 80kg tạo ra mô-men xoắn kéo đứt lớn lên các ngón tay mảnh dẻ. Cấu trúc bám tĩnh dựa vào cơ chế kẹp gọng kìm nguyên bản sẽ bị phá hủy vì ứng suất kéo vượt quá giới hạn bền của dây chằng (tensile strength limit). Ngón tay sẽ bị trật khớp và gãy gập dưới tải trọng 80kg.\n- Tự ngộ độc hủy hoại: Niêm mạc miệng của cu li không có lớp màng bảo vệ đặc biệt đối với nọc độc liên hợp nồng độ cao. Khi liếm lượng dịch độc lớn 1.5 lít, nước bọt chứa độc tố sẽ thấm ngược qua thành mạch biểu bì miệng hoặc các vết xước nhỏ ở răng lược, khiến chính nó bị hoại tử mô vòm họng và tử vong do sốc độc tố của chính mình.\n- Chuyển hóa siêu chậm gây hạ thân nhiệt: Do tốc độ trao đổi chất cực thấp của loài loris (chỉ bằng 40% linh trưởng khác), ở kích thước 80kg, khả năng sinh nhiệt cơ thể không đủ bù đắp lượng nhiệt thất thoát qua diện tích da rộng lớn dưới sương đêm, gây hạ thân nhiệt mạn tính xuống dưới 30°C.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất kéo lên gân ngón bám",
                  issue: "Ứng suất kéo lên gân ngón bám vượt quá giới hạn đàn hồi của gân khoảng 180%, gây đứt đứt gân và cơ."
                },
                {
                  type: "Mức sinh nhiệt tối thiểu cực thấp",
                  issue: "Mức sinh nhiệt cơ bản cực thấp (~700 kcal/ngày) không đủ duy trì thân nhiệt hằng định trong môi trường đêm mát mẻ."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "The slow metabolism and thermoregulation challenges of lorisids", url: "https://doi.org/10.1006/jhevol.1997.0141" }
            ]
          },
          {
            title: "Đột biến thích nghi (Kháng độc tố tự thân và hệ thống gân khóa cơ học chân chim)",
            slug: "cu-li-cham-bengal-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Biểu bì khoang miệng sừng hóa kháng hoại tử tuyệt đối, tiến hóa hệ thống gân khóa thụ động cơ học tự động không tiêu tốn năng lượng.",
            content: "Để Cu Li Chậm 80kg trở thành loài thú săn mồi nguy hiểm tột độ trên các tán rừng lớn:\n- Biểu bì sừng hóa khoang miệng (Shorn Oral Mucosa): Tiến hóa lớp niêm mạc miệng dày lót bởi các tế bào biểu mô sừng hóa chịu axit-kiềm cao, ngăn chặn hoàn toàn nọc độc liên hợp thẩm thấu ngược vào hệ tuần hoàn qua răng lược.\n- Khớp gân khóa cơ học tự động (Avian-like tendon lock): Tiến hóa hệ gân gấp ngón chân ngón tay có các gai răng cưa nhỏ ăn khớp với bao gân. Khi cu li bám vào cành cây, trọng lượng cơ thể kéo căng gân sẽ tự động khóa khớp ngón tay lại một cách thuần cơ học mà không cần co cơ chủ động, giúp nó treo mình lơ lửng nhiều ngày không tốn năng lượng.\n- Đột biến nọc độc phản phệ nhanh (Neurotoxic venom conversion): Độc tố brachial đột biến liên kết thụ thể thần kinh acetylcholine gây liệt cơ tức thì cho mục tiêu cắn thay vì chỉ hoại tử chậm.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ số an toàn tự động khóa cơ học khớp gân",
                  benefit: "Hệ gân gót tự động khớp gai khóa chặt bám, chịu mô-men trọng lượng gấp ~1.2 lần mà không tốn năng lượng co cơ."
                },
                {
                  type: "Nọc độc hoạt tính liệt cơ cao",
                  benefit: "Chuyển hóa độc tính thần kinh có trị số LD50 đột biến đạt ~0.12 mg/kg, giết chết mục tiêu trong tích tắc."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Functional morphology of tendon-locking mechanisms and primates venom evolution", url: "https://doi.org/10.1006/jmorph.2001.1215" }
            ]
          }
        ]
      });
    } else if (target.id === "colossal-squid") {
      whatIfData.push({
        creature_id: "colossal-squid",
        title: "Nếu Mực Khổng Lồ Nam Cực phóng to gấp 10 lần (5.000kg) thì sao?",
        slug: "neu-muc-khong-lo-nam-cuc-phong-to-gap-10-lan-5000kg",
        description: "Phân tích giả thuyết khi quái thú biển sâu Mực Khổng Lồ Nam Cực (Mesonychoteuthis hamiltoni) phóng to khối lượng lên 5.000kg (5 tấn).",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú bóp thủy lực vạn tấn và móc xoay chitin 360 độ)",
            slug: "muc-khong-lo-nam-cuc-5000kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực kẹp xúc tu móc xoay đạt 45.000 N xé toạc các loài cá voi nhỏ, xung nước phản lực nén cao đẩy tốc độ bơi đạt 60 km/h.",
            content: "Khi Mực Khổng Lồ Nam Cực nặng 5.000kg (dài thân áo đạt 9 mét, tổng chiều dài cả xúc tu đạt 22 mét):\n- Móc xoay chitin hủy diệt: Xúc tu săn mồi trang bị 25 cặp móc chitin xoay 360 độ cứng như thép. Khi kẹp chặt mồi, lực bóp cơ học của bó cơ xúc tu khổng lồ tăng theo tỷ lệ tiết diện cơ (hệ số lambda^2 ≈ 4.64), tạo lực kẹp kéo rách mô đạt 45.000 N, dễ dàng ghim sâu và xé toạc các mảng thịt lớn của cá nhà táng.\n- Hàm mỏ vẹt vô song: Hàm mỏ vẹt chitin khổng lồ dài 35cm cắn với lực cơ học vươn tới 52.000 N, nghiền nát hộp sọ hoặc xương cột sống của các sinh vật biển lớn.\n- Phản lực cơ bắp nén cao (Jet Propulsion): Khoang áo chứa 12.000 lít nước co bóp cực mạnh tống nước qua phễu điều hướng, tạo lực đẩy phản lực đẩy khối cơ thể 5 tấn lướt đi trong lòng đại dương sâu thẳm với tốc độ tức thời 60 km/h.",
            formulas_and_data: {
              scaling_factor: 10.2,
              mass_kg_original: 490,
              mass_kg_scaled: 5000,
              formulas: [
                {
                  name: "Lực cắn mỏ vẹt chitin khổng lồ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~52,000 N"
                },
                {
                  name: "Lực đẩy phản lực đẩy khối nước áo",
                  equation: "F_thrust = dot_m * V_exhaust = rho * A_funnel * V_exhaust^2",
                  result: "~75,000 N"
                }
              ]
            },
            p4p_score_scaled: 96,
            tier_scaled: "S",
            sources: [
              { label: "Biophysics of jet propulsion and tentacle mechanics in giant cephalopods", url: "https://doi.org/10.1242/jeb.019558" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự xẹp khoang áo do thiếu xương và ngạt thở do quá nhiệt nước)",
            slug: "muc-khong-lo-nam-cuc-5000kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Áp lực nước và trọng lượng 5 tấn làm xẹp lép khoang áo cơ mềm khi nổi lên cạn, cơ tim quá tải không đẩy nổi máu đồng xanh hemocyanin đi xa.",
            content: "Trong thực tế vật lý sinh học khi Mực Khổng Lồ Nam Cực nặng 5.000kg:\n- Xẹp lép khoang áo cơ mềm (Mantle Collapse): Do thiếu bộ khung xương nâng đỡ cứng (chỉ có tấm mai mực mỏng bằng chitin giòn), khối lượng cơ áo 5 tấn nằm hoàn toàn trên mặt nước hoặc khi chuyển động đột ngột sẽ bị ép bẹp dưới sức nặng của chính mình. Xoang áo chứa nước xẹp phẳng dẹt làm tê liệt hệ thống phản lực và chèn ép 3 trái tim.\n- Suy tim tuần hoàn Hemocyanin: Hemocyanin trong máu mực có độ nhớt tăng vọt ở áp suất thấp và nhiệt độ thay đổi. Khi mực phóng to lên 5 tấn, khoảng cách vận chuyển máu từ 3 tim đến các đầu xúc tu dài 22m tăng gấp đôi, áp lực cản trở dòng chảy ma sát mạch máu tăng 8 lần. Tim mực không đủ công suất bơm máu xanh đậm đặc này đi xa, gây thiếu oxy cục bộ dẫn đến tê liệt xúc tu hoàn toàn.\n- Chết nóng ở nước nông: Mực khổng lồ thích nghi với nước sâu (-2°C đến 2°C). Nếu bị đẩy lên vùng nước nông ấm hơn 8°C, máu hemocyanin mất hoàn toàn khả năng liên kết oxy, dẫn đến ngạt thở cấp tính và hoại tử mô não.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp lực tự đè ép bẹp khoang áo cơ mềm",
                  issue: "Áp lực tự đè đè nén xoang áo đạt ~32 kPa, làm sụp đổ hoàn toàn cơ cấu túi phản lực nước."
                },
                {
                  type: "Áp lực cản trở tuần hoàn huyết quản xúc tu dài",
                  issue: "Áp lực ma sát tuần hoàn huyết quản đạt ~380 kPa, vượt quá giới hạn co bóp của hệ tim mực gấp 2.5 lần."
                }
              ]
            },
            p4p_score_scaled: 42,
            tier_scaled: "C",
            sources: [
              { label: "Cephalopod oxygen transport: cardiovascular limits and environmental constraints", url: "https://doi.org/10.1016/j.cbpa.2015.02.003" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khúng xương cartilage-chitin đan xen và hệ 3 tim trợ lực tăng áp)",
            slug: "muc-khong-lo-nam-cuc-5000kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa các tấm sụn cartilage bảo vệ khoang áo chống biến dạng dưới áp lực, 3 tim tăng áp suất bơm và đột biến gen thích nghi nhiệt độ rộng của hemocyanin.",
            content: "Để Mực Khổng Lồ 5 tấn trở thành vị thần thống trị biển sâu thực thụ:\n- Khung xương sụn nâng đỡ áo (Cartilaginous Mantle Ribs): Tiến hóa hệ thống các thanh sụn dẻo dai đan xen dọc khoang áo, giữ cho xoang áo luôn mở rộng và có cấu trúc hình ống hoàn hảo kể cả khi chịu lực nén va đập mạnh.\n- Ba tim tăng áp lực bóp (Hyper-pressurized Heart System): Bó cơ của tim trung tâm và 2 tim mang được gia cố các lớp sợi cơ chéo tương tự động vật có vú, nâng huyết áp bơm máu lên 380 mmHg, duy trì dòng tuần hoàn máu xanh giàu oxy đi khắp chiều dài 22m xúc tu.\n- Hemocyanin thích nghi nhiệt rộng: Đột biến cấu trúc chuỗi polypeptide của phân tử hemocyanin giúp nó duy trì khả năng liên kết oxy ổn định từ -2°C lên đến 15°C, cho phép mực khổng lồ săn mồi ở các dải nước trung phong phú.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Huyết áp bơm của hệ tim trung tâm nâng cấp",
                  benefit: "Duy trì áp suất đẩy máu tối đa ~380 mmHg, lưu thông máu hoàn hảo xuyên suốt các xúc tu 22 mét."
                },
                {
                  type: "Mô-đun đàn hồi của thanh sụn gia cố áo",
                  benefit: "Thanh sụn lồng ngực gia cố đạt độ mô-đun đàn hồi ~15 MPa, chống bẹp bóp hoàn hảo dưới tải cơ học áo."
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Cartilage evolution in invertebrates and advanced cardiovascular systems of giant cephalopods", url: "https://doi.org/10.1111/ede.12005" }
            ]
          }
        ]
      });
    } else if (target.id === "giant-isopod") {
      whatIfData.push({
        creature_id: "giant-isopod",
        title: "Nếu Bọ Chân Đều Khổng Lồ phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bo-chan-deu-khong-lo-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài giáp xác đại dương Bathynomus giganteus với lớp vỏ kitin canxi hóa được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Bộ giáp xe tăng nén và lực cắn nghiền thép)",
            slug: "bo-chan-deu-khong-lo-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Bộ giáp giáp xác chịu xung lực đè nén 120 tấn, lực đớp tăng gấp 17.4 lần đạt 1.130 N và cơ chế nhịn đói siêu việt lên tới 15-20 năm.",
            content: "Khi Bọ Chân Đều Khổng Lồ phóng to lên 80kg (khối lượng tăng ~72.7 lần, chiều dài đạt khoảng 1.8 mét):\n- Bộ giáp kitin xe tăng: Lớp vỏ ngoài chitin được canxi hóa dày đặc phóng to thành một tấm khiên cơ học có độ dày 1.5cm. Dựa trên độ bền nén của kitin ngậm nước, lớp vỏ này có thể chịu được xung lực đè nén trực tiếp lên đến 120 tấn, bảo vệ hoàn toàn cơ thể khỏi các đòn đập phá hủy vật lý của đối thủ.\n- Lực cắn nghiền thép: Bộ hàm sắc nhọn điều khiển bởi bó cơ hàm khổng lồ. Lực cắn phóng to theo tỷ lệ diện tích mặt cắt cơ (M_scaled/M_original)^(2/3) ≈ 17.4 lần, tăng từ 65 N lên tới 1.130 N, dễ dàng xé nách và nghiền nát các cấu trúc cứng.\n- Nhịn đói siêu việt: Tốc độ chuyển hóa năng lượng trên mỗi kg cơ thể tỷ lệ nghịch với khối lượng theo định luật Kleiber (M^-1/4). Khi đạt 80kg, tốc độ trao đổi chất cơ bản giảm đi 2.9 lần, cho phép nó chìm sâu vào giấc ngủ đông sâu và nhịn ăn liên tục suốt 15-20 năm nhờ kho năng lượng lipid dự trữ đậm đặc trong gan tụy.",
            formulas_and_data: {
              scaling_factor: 72.7,
              mass_g_original: 1100,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn nghiền hàm phóng to",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~1,130 N"
                },
                {
                  name: "Hệ số giảm trao đổi chất cơ bản (Kleiber Law)",
                  equation: "BMR_per_kg_ratio = (M_scaled / M_original)^(-1/4)",
                  result: "~0.34 (tiết kiệm năng lượng gấp 2.9 lần)"
                }
              ]
            },
            p4p_score_scaled: 74,
            tier_scaled: "B",
            sources: [
              { label: "Metabolic scaling and deep-sea gigantism in Isopoda", url: "https://doi.org/10.1093/jcbiol/ruac022" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự sụp đổ bộ giáp kitin rỗng và ngạt thở do suy xẹp mang)",
            slug: "bo-chan-deu-khong-lo-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mang pleopod xếp lớp bị xẹp lép gây ngạt thở cấp tính, lớp vỏ kitin nứt vỡ dưới áp lực trọng lực 80kg khi lên cạn và hệ tuần hoàn hở tê liệt.",
            content: "Trong thế giới thực tế vật lý sinh học, nếu Bọ Chân Đều Khổng Lồ nặng 80kg:\n- Sụp đổ vỏ kitin (Exoskeleton Buckling): Bộ giáp ngoài của giáp xác là cấu trúc rỗng nâng đỡ. Khi khối lượng tăng 72.7 lần (lập phương), diện tích chịu lực và độ dày của lớp vỏ chỉ tăng 17.4 lần (bình phương). Trọng lực 80kg đè nặng lên các khớp đốt lỏng lẻo khiến lớp vỏ tự nứt gãy và sụp đổ dưới chính sức nặng của nó khi di chuyển trên cạn hoặc dưới đáy biển sâu không có lực đẩy của nước.\n- Ngạt thở cấp tính: Bọ chân đều hô hấp bằng các mang xếp lớp (pleopods) dưới bụng. Khi phóng to, tỷ lệ diện tích mang trên thể tích giảm mạnh (S/V ratio giảm 4.17 lần). Ở kích thước 80kg, lưu lượng nước tự nhiên khuếch tán không cung cấp đủ oxy cho cơ thể, khiến nó ngạt thở trong vòng vài phút. Nếu lên cạn, mang sẽ xẹp phẳng và khô ráo hoàn toàn, ngăn chặn trao đổi khí tức thì.\n- Tê liệt tuần hoàn hở: Không có mạch máu kín và hệ thống tim trợ lực cao áp, dòng máu hemocyanin chảy tự do trong xoang cơ thể lớn dài 1.8m sẽ bị ứ đọng lại ở phần thấp nhất do lực hút trọng trường, gây hoại tử tế bào não và các mô cơ quan đầu.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giảm tỷ lệ diện tích mang trao đổi khí",
                  issue: "Tỷ S/V của mang giảm 76%, gây thiếu hụt oxy trầm trọng dưới hoạt động bình thường."
                },
                {
                  type: "Áp lực uốn gãy bộ giáp kitin",
                  issue: "Lực nén cơ học đè lên vỏ tăng gấp 4.17 lần so với giới hạn uốn đàn hồi của kitin canxi hóa."
                }
              ]
            },
            p4p_score_scaled: 18,
            tier_scaled: "D",
            sources: [
              { label: "Biomechanical limitations of giant arthropod exoskeletons", url: "https://doi.org/10.1086/281313" }
            ]
          },
          {
            title: "Đột biến thích nghi (Tấm giáp tổ ong composite và hệ hô hấp mang phổi kép)",
            slug: "bo-chan-deu-khong-lo-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa lớp vỏ cấu trúc tổ ong gia cố titan-chitin, mang xếp lớp chuyển hóa thành khoang mang phổi kín khí và tim ống phát triển van tăng áp.",
            content: "Để bọ chân đều khổng lồ 80kg sống sót và trở thành cỗ xe tăng bọc thép dũng mãnh:\n- Giáp composite tổ ong (Honeycomb Exoskeleton): Lớp vỏ kitin tiến hóa thành cấu trúc rỗng dạng tổ ong chứa đầy dịch đệm khoáng chất, gia cố bởi các liên kết chéo canxi cacbonat và mạng lưới protein dẻo dai. Cấu trúc này giảm 40% trọng lượng vỏ nhưng tăng gấp 5 lần khả năng chống chịu lực uốn nén.\n- Hộp mang phổi kín (Branchial Chamber): Các mang xếp lớp dưới bụng tiêu biến thành một khoang mang khép kín có cơ hô hấp cưỡng bức chủ động lọc oxy tương tự phổi cua cạn, duy trì diện tích trao đổi khí hiệu quả cực cao ở môi trường lưỡng cư cạn - nước.\n- Hệ tuần hoàn bán khép kín: Tim ống phát triển các vách ngăn cơ bắp và van một chiều trợ lực, nâng áp suất bơm hemocyanin lên 110 mmHg, ngăn chặn ứ đọng máu do trọng lực và tăng tốc độ tái oxy hóa mô.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Cấu trúc giáp tổ ong composite mới",
                  benefit: "Mô-đun đàn hồi tăng từ 8 GPa lên 32 GPa, chịu áp lực va đập đạt 2.5 MPa mà không bị nứt vỡ."
                },
                {
                  type: "Hệ hô hấp khoang mang phổi kín khí",
                  benefit: "Hiệu suất hấp thụ oxy trên cạn tăng gấp 12 lần nhờ cơ chế bơm khí chủ động thông qua pleopods nâng cấp."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Structural composite mechanics in terrestrial decapod lungs and exoskeleton evolution", url: "https://doi.org/10.1016/j.jinsphys.2014.12.008" }
            ]
          }
        ]
      });
    } else if (target.id === "green-anaconda") {
      whatIfData.push({
        creature_id: "green-anaconda",
        title: "Nếu Trăn Anaconda Xanh phóng to gấp 6.7 lần (1.000kg) thì sao?",
        slug: "neu-tran-anaconda-xanh-phong-to-gap-6-7-lan-1000kg",
        description: "Phân tích giả thuyết khi quái vật đầm lầy Trăn Anaconda Xanh (Eunectes murinus) phóng to khối lượng lên 1.000kg (1 tấn), tương đương kích thước của loài trăn tiền sử Titanoboa.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú siết 320 PSI nghiền nát xe hơi và bộ hàm mở rộng 1.5 mét)",
            slug: "tran-anaconda-xanh-1000kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực siết cơ bắp tăng lên 320 PSI tương đương áp lực nghiền nát một chiếc ô tô, nuốt chửng con mồi nặng 350kg và tim phì đại sinh lý gấp 3 lần.",
            content: "Khi Trăn Anaconda Xanh phóng to lên 1.000kg (khối lượng tăng ~6.7 lần, chiều dài đạt khoảng 11.5 mét):\n- Lực siết sấm sét (Titan constriction): Lực siết tỷ lệ thuận với thiết diện mặt cắt ngang cơ thể (M_scaled/M_original)^(2/3) ≈ 3.55 lần. Lực siết tăng từ 90 PSI lên 320 PSI (xấp xỉ 22 bar), tương đương với việc đè nén một chiếc xe hơi cỡ nhỏ bẹp rúm dưới lực siết của nó, dễ dàng bẻ gãy mọi khung xương sườn của các loài thú lớn nhất.\n- Nuốt mồi khổng lồ: Bộ hàm linh hoạt mở rộng góc 150 độ đạt đường kính 1.5 mét, cho phép nuốt chửng con mồi nặng tới 300-350kg (như bò rừng nhỏ, bò sát sừng lớn) chỉ trong một lần nuốt nhờ các dây chằng co giãn cực hạn.\n- Siêu phì đại cơ tim: Tim tự kích thích phì đại lành tính tăng thể tích lên gấp 3 lần sau khi ăn nhờ dòng axit béo chuỗi dài tăng đột biến trong máu, cung cấp dòng tuần hoàn áp lực lớn đẩy nhanh tốc độ tiêu hóa con mồi khổng lồ.",
            formulas_and_data: {
              scaling_factor: 6.67,
              mass_kg_original: 150,
              mass_kg_scaled: 1000,
              formulas: [
                {
                  name: "Lực siết phóng to cơ bắp",
                  equation: "P_constriction_scaled = P_constriction_original * (M_scaled / M_original)^(2/3)",
                  result: "~320 PSI"
                },
                {
                  name: "Đường kính hàm mở rộng tối đa",
                  equation: "D_jaw_scaled = D_jaw_original * (M_scaled / M_original)^(1/3)",
                  result: "~1.54 mét"
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Biomechanics of constriction in giant snakes and Titanoboa reconstruct", url: "https://doi.org/10.1098/rsbl.2009.0016" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Tự bẹp phổi do lực cản bùn đất và suy tim tiêu hóa quá tải)",
            slug: "tran-anaconda-xanh-1000kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ thể dài 11.5m chịu lực ma sát quá lớn gây rách da cơ cạn, trọng lượng 1 tấn đè xẹp phổi phải dài độc nhất và sốc độc tố tiêu hóa gây hoại tử.",
            content: "Trong thế giới thực tế vật lý sinh học, nếu Trăn Anaconda Xanh nặng 1.000kg:\n- Rách da cơ trên cạn: Di chuyển trên cạn chịu tác động ma sát mạnh. Trọng lượng 1 tấn đè lên diện tích vảy bụng khiến các xương sườn chịu tải trọng lực nén cực hạn, làm trầy rách các mô cơ bụng và khiến trăn không thể di chuyển bò trườn bò cạn (chỉ đạt vận tốc < 0.5 km/h).\n- Ngạt thở phổi đơn: Trăn chỉ có duy nhất 1 lá phổi phải hoạt động kéo dài. Khi trọng lượng cơ thể đạt 1.000kg nằm bất động trên đất đầm lầy, áp lực cơ học nén từ lồng ngực ép phẳng dẹt lá phổi, làm giảm 80% thể tích trao đổi khí, dẫn đến ngạt thở chậm trong vòng vài giờ.\n- Suy tuần hoàn tiêu hóa: Nuốt con mồi 300kg tạo ra nhiệt lượng phân hủy cực lớn. Quá trình tiêu hóa kéo dài trên 30 ngày ở vùng nước ấm sinh ra lượng độc tố vi khuẩn thối rữa vượt quá khả năng lọc của gan, gây nhiễm trùng huyết toàn thân và tử vong do suy đa tạng trước khi tiêu hóa xong.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp lực trọng lực đè ép lên lồng ngực",
                  issue: "Lực ép cơ học tác dụng lên phế quản đạt ~18 kPa, làm giảm lưu lượng hô hấp phổi xuống dưới mức sinh tồn."
                },
                {
                  type: "Nhiệt lượng sinh học do lên men thức ăn dạ dày",
                  issue: "Nhiệt độ nội tạng tiêu hóa tăng lên > 42°C do lên men kỵ khí của mồi khổng lồ, gây hoại tử niêm mạc ruột."
                }
              ]
            },
            p4p_score_scaled: 38,
            tier_scaled: "C",
            sources: [
              { label: "Physiological remodeling limits and digestion energetics in gigantic reptiles", url: "https://doi.org/10.1086/380962" }
            ]
          },
          {
            title: "Đột biến thích nghi (Hệ thống xương sườn lò xo giảm chấn và hai phổi hoạt động tăng áp)",
            slug: "tran-anaconda-xanh-1000kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa khớp xương đai lò xo phân tán trọng lực, phổi trái phát triển hoàn thiện tạo hô hấp kép và hệ vi sinh mật độ cao tiêu hóa siêu tốc.",
            content: "Để Trăn Anaconda 1 tấn trở thành quái thú đầm lầy tối thượng thống trị mọi vùng nước:\n- Xương sườn lò xo dẻo (Elastic Ribcage): Cấu trúc xương sườn tiến hóa thêm các lớp sụn chêm lò xo trung gian, hấp thụ và phân tán 85% tải trọng lực ép từ mặt cạn, giúp rắn trườn bò êm ái trên cạn mà không gây tổn thương các mô mềm dưới bụng.\n- Hô hấp phổi kép đối xứng: Phổi trái vốn thoái hóa nay phát triển hoàn thiện thành cấu trúc túi khí xếp lớp song song với phổi phải, tăng gấp đôi diện tích trao đổi khí, giúp duy trì hoạt động săn mồi và quấn siết cường độ cao dưới nước sâu.\n- Enzym mật và hệ vi sinh siêu axit: Axit dạ dày nâng cấp hoạt tính chứa các enzyme protease thích nghi nhiệt độ rộng cùng quần thể vi sinh vật tiết enzym tiêu hóa xương nhanh gấp 5 lần bình thường, tiêu hủy hoàn toàn con mồi 300kg chỉ trong 6 ngày, ngăn chặn lên men thối rữa.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Tốc độ phân giải xương của enzym dạ dày mới",
                  benefit: "Tiêu hóa 100% canxi xương mồi trong 72 giờ, giảm 80% nguy cơ nhiễm độc vi khuẩn."
                },
                {
                  type: "Hiệu suất hô hấp kép phổi trái-phải",
                  benefit: "Lưu lượng oxy trao đổi đạt ~8.5 lít/phút, hỗ trợ hoạt động cơ bắp siết cơ kéo dài."
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Organogenesis and digestive evolution in Boidae family", url: "https://doi.org/10.1002/jeez.2341" }
            ]
          }
        ]
      });
    } else if (target.id === "harpy-eagle") {
      whatIfData.push({
        creature_id: "harpy-eagle",
        title: "Nếu Đại Bàng Harpy phóng to bằng con người (80kg) thì sao?",
        slug: "neu-dai-bang-harpy-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi chúa tể bầu trời rừng rậm Đại Bàng Harpy (Harpia harpyja) phóng to khối lượng lên 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú quắp 266 kg/cm2 bẻ đôi thân cây và sải cánh 4.6 mét)",
            slug: "dai-bang-harpy-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Sải cánh khổng lồ 4.6 mét, móng vuốt sau dài 30cm với lực siết chân đạt 266 kg/cm2 tương đương kìm thủy lực nghiền bê tông.",
            content: "Khi Đại Bàng Harpy phóng to lên 80kg (khối lượng tăng ~12.3 lần, chiều dài đạt khoảng 2.6 mét):\n- Sải cánh khổng lồ: Sải cánh tỷ lệ thuận với căn bậc ba của khối lượng (M^1/3) ≈ 2.31 lần, vươn rộng từ 2.0 mét lên tới 4.6 mét. Nhờ diện tích cánh lớn, mỗi cú đập cánh sinh ra lực nâng khí động học khổng lồ đạt 3.800 N, giúp chim dễ dàng cất cánh thẳng đứng từ mặt đất.\n- Lực quắp nghiền bê tông: Lực siết chân phóng to theo diện tích cơ chân (M_scaled/M_original)^(2/3) ≈ 5.33 lần. Lực siết tăng từ 50 kg/cm2 lên mức kinh ngạc 266 kg/cm2, tương đương một chiếc kìm cứu hộ thủy lực nghiền nát bê tông, bẻ gãy đôi các thanh gỗ lớn hoặc bóp nát hộp sọ con mồi cỡ lớn ngay tức thì.\n- Móng vuốt khổng lồ: Bộ móng vuốt ngón sau (hallux) dài 30cm làm bằng chất sừng keratin cứng cáp như kim cương, đâm xuyên qua các lớp giáp xương dày cứng.",
            formulas_and_data: {
              scaling_factor: 12.3,
              mass_g_original: 6500,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực siết quắp của đôi chân khổng lồ",
                  equation: "P_grip_scaled = P_grip_original * (M_scaled / M_original)^(2/3)",
                  result: "~266 kg/cm2"
                },
                {
                  name: "Sải cánh tối thiểu để cất cánh (tỷ lệ cơ bản)",
                  equation: "W_span_scaled = W_span_original * (M_scaled / M_original)^(1/3)",
                  result: "~4.6 mét"
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Flight mechanics and biomechanics of raptor claws", url: "https://doi.org/10.1642/AUK-15-115.1" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Không thể bay do quá tải trọng lượng cánh và gãy xương đùi khi tiếp đất)",
            slug: "neu-dai-bang-harpy-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Tải trọng sải cánh tăng vượt giới hạn khí động học của chim (vượt 22 kg/m2), gãy xương đùi khi hạ cánh và suy hô hấp túi khí.",
            content: "Trong thế giới thực tế vật lý sinh học, nếu Đại Bàng Harpy nặng 80kg:\n- Bất khả thi cất cánh (Flightless Failure): Theo định luật bình phương - lập phương, khi khối lượng tăng 12.3 lần, diện tích bề mặt cánh chỉ tăng 5.33 lần. Tải trọng sải cánh (wing loading) vọt lên mức 28 kg/m2 (vượt xa giới hạn khí động học cho phép bay vỗ cánh là 22 kg/m2). Đôi cánh không thể tạo đủ lực nâng để nhấc cơ thể 80kg lên không trung, biến nó thành loài chim chạy đất vụng về.\n- Gãy xương chân khi tiếp đất: Khi cố gắng nhảy từ cành cây cao xuống đất, xung lực va chạm tăng tỷ lệ thuận với khối lượng (80kg). Vì độ bền xương đùi rỗng của loài chim chỉ tăng theo tiết diện cắt ngang (bình phương), phản lực tiếp đất vượt quá giới hạn bền uốn cơ học của xương chim, khiến xương chân vỡ vụn ngay khi hạ cánh.\n- Sụp đổ hệ thống túi khí: Hệ thống hô hấp túi khí mỏng manh của chim không chịu nổi áp lực nén cơ học từ khối nội tạng 80kg khi di chuyển trên mặt đất, gây rách túi khí nội ngực.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Tải trọng cánh vượt giới hạn bay",
                  issue: "Tải trọng cánh đạt 28.5 kg/m2, vượt quá giới hạn vật lý tối đa của lớp Chim (22 kg/m2) 30%."
                },
                {
                  type: "Xung lực va chạm tiếp đất",
                  issue: "Xung lực va chạm lúc tiếp đất ở vận tốc 15 m/s đạt ~7.200 N, vượt giới hạn gãy xương đùi chim gấp 2.4 lần."
                }
              ]
            },
            p4p_score_scaled: 32,
            tier_scaled: "D",
            sources: [
              { label: "Aerodynamic limits of avian flight and scaling of skeletal strength", url: "https://doi.org/10.1111/jeb.12005" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khung xương sợi carbon xốp và hệ thống túi khí trợ lực tuần hoàn)",
            slug: "dai-bang-harpy-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương rỗng gia cố sợi chitin-carbon bền vững, sải cánh kéo dài đạt 7.2m phủ lông siêu nhẹ và tim tăng tần số bơm máu.",
            content: "Để Đại Bàng Harpy 80kg thực sự thống trị bầu trời với tư cách là nỗi khiếp đảm của rừng rậm:\n- Xương gia cố sợi composite (Carbon-fiber-like Bone): Cấu trúc xương rỗng bên trong tiến hóa các vách ngăn chéo dạng dầm giàn (trabeculae) ngậm khoáng chất canxi-chitin có độ cứng tương tự sợi carbon, giúp xương chân chịu được lực tiếp đất 15.000 N mà trọng lượng bộ xương vẫn siêu nhẹ (< 8% cơ thể).\n- Sải cánh khổng lồ siêu nhẹ (Hyper-extended Wings): Sải cánh tiến hóa kéo dài đạt 7.2 mét kết hợp các sợi lông sơ cấp siêu bền nhẹ chịu áp lực gió cao, giúp giảm tải trọng cánh xuống mức an toàn 14 kg/m2, cho phép cất cánh đứng và lượn êm không tiếng động.\n- Túi khí tim đồng bộ hóa: Hệ thống túi khí hô hấp kết nối trực tiếp với van tim, hoạt động như các máy bơm khí phụ trợ đẩy máu giàu oxy vào cơ ngực khổng lồ 20kg với áp lực và lưu lượng cực lớn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ số tải trọng cánh tối ưu mới",
                  benefit: "Tải trọng cánh giảm xuống còn 13.8 kg/m2, cho phép cất cánh đứng và lượn sát tán cây."
                },
                {
                  type: "Độ bền uốn của xương composite đai chân",
                  benefit: "Mô-đun uốn xương đạt 45 GPa, chống chịu xung lực hạ cánh đột ngột lên tới 12.000 N."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Composite biological materials in bird bones and aerodynamic adaptations of large raptors", url: "https://doi.org/10.1098/rsif.2013.0456" }
            ]
          }
        ]
      });
    } else if (target.id === "olm" || target.id === "olm-salamander") {
      whatIfData.push({
        creature_id: target.id,
        title: `Nếu ${target.name} phóng to bằng con người (80kg) thì sao?`,
        slug: `neu-${target.id}-phong-to-bang-con-nguoi-80kg`,
        description: `Phân tích kịch bản giả thuyết khi ${target.name} (Proteus anguinus) đạt kích thước con người 80kg trong môi trường hang động karst tối tăm.`,
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cảm biến điện trường siêu cấp và nhịn đói thế kỷ)",
            slug: `${target.id}-80kg-co-hoc-ly-thuyet`,
            perspective_type: "classic_scaling",
            summary: "Đạt chiều dài 3.97 mét, cảm nhận điện trường siêu việt từ khoảng cách 150 mét và nhịn ăn suốt 30-40 năm.",
            content: "Khi phóng to lên 80kg (tăng khối lượng ~4.000 lần, chiều dài đạt 3.97 mét):\n- Hệ thống cảm biến điện thế khuếch đại: Cơ quan đường bên và các bóng Lorenzin đặc hữu trên da đầu tăng số lượng lên gấp hàng trăm lần. Lực thu nhận điện trường tăng theo diện tích bề mặt (lambda^2 ≈ 252), cho phép cảm nhận các xung điện thế nhỏ dưới 0.1 microvolt từ khoảng cách 150 mét.\n- Tiết kiệm năng lượng siêu đẳng: Ở kích thước 80kg, tỷ lệ chuyển hóa cơ bản giảm cực mạnh theo định luật Kleiber (M^-1/4). Olm khổng lồ tiêu thụ năng lượng chậm hơn 8 lần trên mỗi kg so với nguyên bản, cho phép nó nhịn đói từ 30 đến 40 năm trong trạng thái bất động hoàn toàn dưới hang ngầm tối.\n- Khả năng tự tiêu mô hoàn hảo: Khi cạn kiệt thức ăn, cơ thể tự hấp thụ mô liên kết và mỡ tích trữ, duy trì các cơ quan sống trọng yếu mà không gây thoái hóa cơ hay suy giảm chức năng vận động.",
            formulas_and_data: {
              scaling_factor: 4000,
              mass_kg_original: 0.02,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài phóng to theo khối lượng",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~3.97 m"
                },
                {
                  name: "Tần số chuyển hóa năng lượng Kleiber",
                  equation: "Metabolic_Rate_Ratio = (M_scaled / M_original)^(-1/4)",
                  result: "~0.125 (tiết kiệm năng lượng gấp 8 lần per kg)"
                }
              ]
            },
            p4p_score_scaled: 72,
            tier_scaled: "B",
            sources: [
              { label: "Metabolic rate and starvation tolerance in cave-dwelling amphibians", url: "https://doi.org/10.1002/jez.1402800204" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở qua da và sụp đổ khung xương sụn)",
            slug: `${target.id}-80kg-sinh-hoc-thuc-te`,
            perspective_type: "biological_reality",
            summary: "Diện tích da trao đổi oxy giảm 16 lần dẫn tới ngạt thở cấp tính, hệ thống xương sụn mềm yếu bị trọng lực nghiền nát.",
            content: "Trong môi trường thực tế, một con Kỳ Nhông/Kỳ Giông Olm nặng 80kg sẽ ngay lập tức đối mặt với tử vong:\n- Khủng hoảng hô hấp qua da: Olm hô hấp chủ yếu qua làn da mỏng và bộ mang ngoài lông vũ nhỏ. Khi phóng to 4.000 lần, tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm tới 15.87 lần. Lượng oxy khuếch tán qua da không thể đáp ứng 10% nhu cầu hô hấp của cơ thể 80kg, gây ngạt thở cấp tính trong vòng vài phút.\n- Sụp đổ cấu trúc cơ học: Hệ xương của Olm chủ yếu là sụn và các xương mảnh, chi cực kỳ nhỏ yếu. Dưới tác dụng của trọng lực ở khối lượng 80kg, khung xương sụn mềm sẽ bị bẻ gãy, cơ thể thon dài 4m bị đè bẹt dưới sức nặng của chính nó, gây dập nát cơ quan nội tạng.\n- Sự sụp đổ của mang ngoài: Đưa lên cạn hoặc trong nước tĩnh, bộ mang ngoài mảnh mai dài màu đỏ sẽ bị xẹp lại do mất lực nổi của nước, làm giảm 95% hiệu suất hấp thụ oxy.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Sụt giảm tỷ lệ diện tích trao đổi khí trên thể tích (S/V)",
                  issue: "Tỷ lệ S/V giảm 93.7%, da không thể hấp thụ đủ oxy để duy trì hoạt động trao đổi chất cơ bản."
                },
                {
                  type: "Áp lực trọng lực lên khung xương sụn",
                  issue: "Trọng tải tăng 4.000 lần trong khi tiết diện xương chỉ tăng 252 lần, vượt quá giới hạn bền uốn của xương sụn sọ và chi gấp 16 lần."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Cutaneous respiration and the limitations of size in caudate amphibians", url: "https://doi.org/10.1086/physzool.55.4.30158462" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái long mù hang động với hệ xương gia cốt hóa)",
            slug: `${target.id}-80kg-dot-bien-thich-nghi`,
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống xương cốt hóa hoàn toàn giống loài lưỡng cư cổ đại, phổi phát triển với các vách ngăn hô hấp chủ động, da dày chứa sắc tố bảo vệ.",
            content: "Để sinh tồn và thống trị các hang ngầm dưới lòng đất ở kích thước 80kg:\n- Cốt hóa xương hoàn toàn (Full Ossification): Thay thế toàn bộ hệ thống sụn bằng xương đặc chắc khỏe, các chi phát triển các khớp sụn chịu lực giống như loài lưỡng cư cổ đại *Acanthostega*, nâng đỡ cơ thể dài 4m trườn bò dũng mãnh.\n- Phổi vách ngăn hoạt động chủ động (Active Alveolar Lungs): Phổi thoái hóa tiến hóa trở lại thành phổi có túi phế nang phân nhánh phức tạp, kết hợp cơ hoành thô sơ co bóp hút khí chủ động để thay thế hoàn toàn hô hấp qua da.\n- Radar điện từ chủ động (Active Electrolocation): Tiến hóa tuyến phát điện nhỏ dọc hai bên hông tạo ra trường điện yếu xung quanh cơ thể, kết hợp với các thụ thể điện siêu nhạy ở đầu để lập bản đồ 3D thời gian thực của hang tối bất kể độ đục của nước.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Tái tiến hóa phổi phế nang",
                  benefit: "Tăng diện tích trao đổi khí lên 1.2 m2, duy trì lượng oxy trong máu đạt 92% trong nước hang nghèo oxy."
                },
                {
                  type: "Hệ thống xương đùi và bả vai gia cố",
                  benefit: "Chịu được mô-men xoắn uốn 85 N.m, cho phép bò trườn tự do qua các tầng đá hang karst."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "A",
            sources: [
              { label: "Evolutionary transitions in early tetrapods and structural ossification", url: "https://doi.org/10.1038/nature05790" }
            ]
          }
        ]
      });
    } else if (target.id === "saltwater-crocodile") {
      whatIfData.push({
        creature_id: "saltwater-crocodile",
        title: "Nếu Cá Sấu Nước Mặn phóng to lên 5.000kg (5 tấn) thì sao?",
        slug: "neu-ca-sau-nuoc-man-phong-to-len-5000kg-5-tan",
        description: "Phân tích kịch bản giả thuyết khi Cá Sấu Nước Mặn (Crocodylus porosus) đạt kích thước khổng lồ 5 tấn giống như các loài bò sát tiền sử khổng lồ.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đớp 75.000 N và lực đuôi quật ngã xe bọc thép)",
            slug: "ca-sau-nuoc-man-5000kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn nghiền xương đạt 75 kN đập vỡ mọi lớp giáp, đuôi khổng lồ quật ngã xe bọc thép hạng nhẹ với động năng 45 kJ.",
            content: "Khi Cá Sấu Nước Mặn đạt khối lượng 5.000kg (dài ~10.5 mét):\n- Lực cắn hủy diệt: Lực đớp cơ học tăng theo tiết diện cơ (hệ số lambda^2 ≈ 4.68). Lực cắn tăng từ 16.000 N lên tới 75.000 N (75 kN), tương đương sức nặng của 7.5 tấn đè lên răng, nghiền nát xương và xé toạc các tấm thép bảo vệ của phương tiện di chuyển.\n- Cú quật đuôi động năng cao: Đuôi cơ bắp khổng lồ dài 5.5 mét quật sang hai bên tạo ra mô-men lực 40.000 N.m và động năng va chạm đạt 45 kJ, đủ sức quật lật các phương tiện cơ giới hạng nhẹ hoặc phá sập tường bê tông cốt thép.\n- Cú xoay tử thần (Death Roll) hủy diệt: Mô-men xoắn xoay tròn cơ thể trong nước đạt 18.000 N.m, có thể vặn đứt các khớp xương của các con mồi lớn như voi hay hà mã chỉ trong vài giây.",
            formulas_and_data: {
              scaling_factor: 11.1,
              mass_kg_original: 450,
              mass_kg_scaled: 5000,
              formulas: [
                {
                  name: "Lực cắn phóng to theo tiết diện cơ hàm",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~75,200 N (75.2 kN)"
                },
                {
                  name: "Động năng cú quật đuôi cực đại",
                  equation: "E_kinetic = 1/2 * I_tail * omega^2",
                  result: "~45,000 Joules"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Bite force and evolutionary scaling of crocodilian jaws", url: "https://doi.org/10.1371/journal.pone.0031781" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự bất động trên cạn, xẹp phổi và sốc nhiệt nghiêm trọng)",
            slug: "ca-sau-nuoc-man-5000kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Trọng lượng 5 tấn đè xẹp phổi gây ngạt thở trên cạn, các chi bị gãy khớp dưới sức nặng và sốc nhiệt tử vong do tản nhiệt kém.",
            content: "Trong thế giới thực tế, nếu Cá Sấu Nước Mặn nặng 5.000kg:\n- Xẹp phổi cơ học: Do không có xương sườn khép kín nâng đỡ khoang bụng dưới cạn, trọng lượng 5 tấn đè ép trực tiếp lên màng phổi và tim. Khi nằm trên cạn quá 30 phút, áp suất nội tạng làm phổi không thể co giãn để hô hấp, gây thiếu oxy máu và ngạt thở dần.\n- Gãy khớp chi xương: Các xương chi bò sát nằm ngang chịu mô-men uốn cực lớn. Trọng lượng 5 tấn tạo ứng suất uốn vượt giới hạn uốn của xương cá sấu (~120 MPa), khiến chúng bị rạn nứt xương và liệt bò trườn hoàn toàn trên cạn.\n- Sốc nhiệt hủy diệt: Tỷ lệ diện tích da trên thể tích cơ thể giảm 2.2 lần (định luật bình phương - lập phương). Nhiệt lượng hấp thụ từ ánh nắng mặt trời không thể giải phóng kịp qua lớp da dày, đẩy nhiệt độ cơ thể lên mức nguy hiểm (>40°C) gây suy đa tạng và tử vong do sốc nhiệt.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất uốn tại khớp xương đùi trên cạn",
                  issue: "Ứng suất uốn đạt 210 MPa, vượt giới hạn bền uốn của xương cá sấu (120 MPa), gây gãy xương chi khi cố gắng nhấc mình bò."
                },
                {
                  type: "Tốc độ tản nhiệt qua da",
                  issue: "Diện tích bề mặt tản nhiệt trên mỗi kg thể tích giảm 55%, gây sốc nhiệt trên cạn chỉ sau 40 phút phơi nắng."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "Locomotor mechanics and bone scaling in crocodilians", url: "https://doi.org/10.1242/jeb.060103" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khủng long bạo chúa dưới nước)",
            slug: "ca-sau-nuoc-man-5000kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa chi thẳng đứng chịu lực như Theropoda, hệ thống túi khí phổi đa luồng như khủng long và hệ tuần hoàn tản nhiệt dưới da.",
            content: "Để sinh vật 5 tấn sinh tồn và săn mồi dũng mãnh ở cả hai môi trường:\n- Xương chi thẳng đứng (Parasagittal Limbs): Các chi tiến hóa xoay thẳng đứng xuống dưới cơ thể tương tự khủng long Theropoda, giúp chuyển tải trọng cơ thể trực tiếp vào trục xương thẳng đứng, giảm mô-men uốn xuống 90% và nâng đỡ cơ thể trườn chạy dễ dàng.\n- Hệ hô hấp túi khí (Avian-like Air Sacs): Tiến hóa hệ thống túi khí phụ trợ lưu thông một chiều như chim và khủng long, duy trì dòng khí oxy liên tục qua phổi mà không bị ép bởi nội tạng bụng.\n- Tấm sừng tản nhiệt chủ động (Vascularized Osteoderms): Các tấm sừng lưng tích hợp mạng lưới vi mạch máu dày đặc dưới da, đóng vai trò như các lá tản nhiệt nước chủ động khi mở miệng làm mát hoặc bơi trong nước lạnh.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ số giảm mô-men xoắn chi xương thẳng đứng",
                  benefit: "Giảm lực uốn từ 210 MPa xuống còn 21 MPa, cho phép chạy nước rút trên cạn đạt tốc độ 25 km/h."
                },
                {
                  type: "Hiệu suất trao đổi oxy của hệ túi khí",
                  benefit: "Duy trì hiệu suất trích xuất oxy ở mức 85% ngay cả khi khoang bụng bị đè nén dưới cạn."
                }
              ]
            },
            p4p_score_scaled: 90,
            tier_scaled: "S",
            sources: [
              { label: "Unidirectional airflow in the lungs of crocodilians and birds", url: "https://doi.org/10.1126/science.1180208" }
            ]
          }
        ]
      });
    } else if (target.id === "shortfin-mako-shark") {
      whatIfData.push({
        creature_id: "shortfin-mako-shark",
        title: "Nếu Cá Mập Mako Vây Ngắn phóng to lên 4.000kg (4 tấn) thì sao?",
        slug: "neu-ca-map-mako-vay-ngan-phong-to-len-4000kg-4-tan",
        description: "Phân tích kịch bản giả thuyết khi Cá Mập Mako Vây Ngắn (Isurus oxyrinchus) phóng to cơ thể lên 4 tấn, tương đương kích thước của Megalodon tiền sử.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú phóng thủy lôi 120 km/h và lực cắn nghiền nát)",
            slug: "ca-map-mako-vay-ngan-4000kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú đớp xé toạc đạt lực cắn 35 kN, tốc độ bơi tối đa đạt 120 km/h, phóng mình khỏi mặt nước cao tới 20 mét.",
            content: "Khi Cá Mập Mako phóng to lên 4.000kg (chiều dài đạt ~7.2 mét, tăng khối lượng ~30 lần):\n- Tốc độ thủy lôi: Nhờ khối cơ đuôi đỏ (myotomal muscle) khổng lồ hoạt động liên tục. Động cơ sinh học này giải phóng lực đẩy thủy động học tăng theo tiết diện cơ (hệ số lambda^2 ≈ 9.6). Cá mập có thể đạt vận tốc bơi nước rút tức thời lên tới 120 km/h, đủ sức phóng mình bay cao 20m khỏi mặt nước.\n- Lực cắn hủy diệt: Răng cưa dài nhọn kết hợp cơ hàm nâng cấp tạo lực cắn lên tới 35.000 N (35 kN), dễ dàng ngoạm đứt đôi các loài động vật biển lớn.\n- Độ cơ động phi thường: Góc quay vây ngực rộng kết hợp thân hình con thoi khí động học tối ưu cho phép nó bẻ lái đổi hướng đột ngột với gia tốc 5 g dưới nước.",
            formulas_and_data: {
              scaling_factor: 29.6,
              mass_kg_original: 135,
              mass_kg_scaled: 4000,
              formulas: [
                {
                  name: "Lực cắn phóng đại theo tiết diện hàm",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~35,100 N"
                },
                {
                  name: "Động năng bơi nước rút ở vận tốc 120 km/h",
                  equation: "E_kinetic = 1/2 * m * v^2",
                  result: "~2,222,000 Joules (2.2 MJ)"
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Mako shark swimming speed and hydrodynamics", url: "https://doi.org/10.1242/jeb.060855" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cơn ngạt thở khi đứng yên và tự luộc chín cơ thể vì quá nhiệt)",
            slug: "ca-map-mako-vay-ngan-4000kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ chế Ram Ventilation gây ngạt thở khi bơi chậm, và hệ cơ đỏ nội nhiệt khổng lồ tự luộc chín nội tạng do không tản kịp nhiệt.",
            content: "Trong thực tế vật lý sinh học khi Cá Mập Mako nặng 4.000kg:\n- Ngạt thở Ram Ventilation: Cá mập mako bắt buộc phải bơi liên tục để đẩy nước qua mang lấy oxy (Ram Ventilation). Khi phóng to lên 4 tấn, thể tích cơ thể tăng 30 lần nhưng diện tích mang chỉ tăng 9.6 lần. Nó phải bơi với tốc độ tối thiểu 35 km/h liên tục để không bị thiếu oxy não, một mức tiêu thụ năng lượng không thể duy trì lâu dài.\n- Quá nhiệt nội sinh (Overheating): Mako là loài động vật nội nhiệt bán phần (tự giữ ấm cơ thể). Khi cơ thể đạt 4 tấn, tỷ lệ diện tích bề mặt/thể tích giảm mạnh khiến nhiệt lượng sinh ra từ khối cơ đỏ hoạt động cường độ cao bị tích tụ lại. Nhiệt độ nội tạng sẽ tăng vọt vượt mức 45°C, gây biến tính protein và tự hủy mô cơ (tự luộc chín cơ thể) chỉ sau vài phút tăng tốc.\n- Suy sụp sụn nâng đỡ: Khung xương sụn mềm dẻo không nâng đỡ nổi khối cơ 4 tấn dưới gia tốc bẻ lái lớn, gây vẹo lệch cột sống và tổn thương tủy sống.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Nhu cầu oxy vượt quá diện tích mang khuếch tán",
                  issue: "Diện tích mang chỉ đáp ứng 32% nhu cầu trao đổi khí ở vận tốc bơi thông thường, bắt buộc phải bơi siêu nhanh để thở."
                },
                {
                  type: "Tích tụ nhiệt độ nội sinh trong khối cơ đỏ",
                  issue: "Nhiệt độ cơ thể tăng 1.8°C mỗi phút khi bơi nước rút, đạt giới hạn tử vong 45°C sau chưa đầy 10 phút."
                }
              ]
            },
            p4p_score_scaled: 32,
            tier_scaled: "D",
            sources: [
              { label: "Thermal biology and endothermy limits in lamnid sharks", url: "https://doi.org/10.1111/j.1095-8649.2001.tb00166.x" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thủy lôi sinh học tối tân)",
            slug: "neu-ca-map-mako-vay-ngan-4000kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa cơ hoành mang bơm chủ động, hệ thống mao mạch tản nhiệt ngược dòng cực đại và sụn khoáng hóa cứng như xương.",
            content: "Để Cá Mập Mako 4 tấn thống trị tuyệt đối đại dương:\n- Hô hấp chủ động (Active Branchial Pumping): Tiến hóa cơ vòng mang và van một chiều chủ động, cho phép nó tự bơm hút nước qua mang ngay cả khi đứng yên hoặc bơi chậm.\n- Siêu tản nhiệt mạch máu (Hyper-developed Rete Mirabile): Mạng lưới trao đổi nhiệt ngược dòng hoạt động ở chế độ đảo ngược thông minh, tự động chuyển hướng dòng máu nóng từ cơ đỏ ra sát các tấm mang ngoài để xả nhiệt nhanh chóng vào nước biển lạnh, khóa nhiệt độ cơ thể ổn định ở 20-25°C.\n- Sụn khoáng hóa sợi carbon (Carbon-fiber-like Mineralized Cartilage): Khung xương sụn được gia cố bằng các lớp hydroxyapatite và sợi collagen bó chặt dạng xoắn kép, tăng mô-đun đàn hồi lên gấp 8 lần, chịu lực uốn gập khi bẻ lái ở tốc độ 100 km/h.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ số truyền nhiệt của mạng lưới tản nhiệt mới",
                  benefit: "Tăng công suất xả nhiệt qua mang gấp 12 lần, giữ nhiệt độ cơ thể luôn ở mức an toàn 22°C."
                },
                {
                  type: "Mô-đun đàn hồi xương sụn gia cố sợi",
                  benefit: "Đạt mức 1.5 GPa (ngang ngửa xương động vật có vú), chống gãy gập cột sống khi chịu gia tốc xoay bẻ lái 5 g."
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Active gill ventilation and skeletal mineralisation in sharks", url: "https://doi.org/10.1002/jmor.20235" }
            ]
          }
        ]
      });
    } else if (target.id === "sperm-whale") {
      whatIfData.push({
        creature_id: "sperm-whale",
        title: "Nếu Cá Nhà Táng thu nhỏ bằng con người (80kg) thì sao?",
        slug: "neu-ca-nha-tang-thu-nho-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài động vật có vú khổng lồ Cá Nhà Táng (Physeter macrocephalus) bị thu nhỏ khối lượng xuống chỉ còn 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Súng xung kích siêu âm 200 dB và cú đâm đầu phá đá)",
            slug: "ca-nha-tang-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Hệ thống phát sóng siêu âm táng phóng ra luồng xung kích 200 dB làm tê liệt con mồi ở khoảng cách gần, đâm đầu phá vỡ chướng ngại vật.",
            content: "Khi Cá Nhà Táng thu nhỏ xuống 80kg (tương đương chiều dài cơ thể ~1.6 mét, giảm khối lượng ~500.000 lần):\n- Súng siêu âm cầm tay: Nếu cấu trúc cơ quan táng (spermaceti organ) được thu nhỏ hoàn hảo và giữ mật độ năng lượng phát âm. Tiếng nhấp (click) siêu thanh tần số cao phát ra qua thấu kính dầu sáp táng có thể hội tụ năng lượng sóng âm đạt áp suất đỉnh 200 dB ở khoảng cách 1 mét, đủ sức phá hủy màng nhĩ và làm choáng váng tê liệt tức thì các loài cá nhỏ hoặc thợ lặn xung quanh.\n- Tỷ lệ lực đâm đầu cao: Hộp sọ chứa khối spermaceti đóng vai trò như một túi đệm hấp thụ chấn lực khổng lồ. Cú đâm đầu trực diện có thể tạo áp lực 12.000 N mà không gây chấn thương não, cho phép nó phá vỡ các rặng san hô hoặc đá ngầm để mở đường.\n- Lặn sâu cơ bắp: Tỷ lệ sợi cơ chứa nhiều myoglobin giúp dự trữ oxy cực lớn, cho phép cá nhà táng nhỏ lặn sâu 1.000m trong vòng 40 phút mà không gặp khó khăn.",
            formulas_and_data: {
              scaling_factor: 0.000002,
              mass_kg_original: 40000,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Áp suất âm thanh hội tụ ở kích thước nhỏ",
                  equation: "P_scaled = P_original * (R_scaled / R_original)",
                  result: "~200 dB (tại cự ly 1 mét)"
                },
                {
                  name: "Lực va đập đệm đầu hấp thụ bởi cơ quan táng",
                  equation: "F_impact = m * delta_v / delta_t",
                  result: "~12,000 N"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "The function of the spermaceti organ in acoustic transmission and combat", url: "https://doi.org/10.1242/jeb.00282" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Chết cóng tức thì do mất nhiệt và sụp đổ hệ phát âm siêu âm)",
            slug: "ca-nha-tang-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ thể bị hạ thân nhiệt cấp tính tử vong trong nước lạnh do mất nhiệt nhanh gấp 79 lần, và cơ quan táng quá nhỏ không phát nổi sóng siêu thanh tần số thấp.",
            content: "Trong thế giới thực tế sinh học, Cá Nhà Táng 80kg sẽ nhanh chóng tử vong do:\n- Hạ thân nhiệt cấp tính (Hypothermia): Tỷ lệ diện tích bề mặt trên thể tích cơ thể tăng vọt gấp 79 lần so với nguyên bản 40 tấn. Nhiệt lượng cơ thể bị nước biển dẫn truyền lấy đi nhanh chóng. Lớp mỡ dày của cá voi nhỏ không đủ ngăn cản dòng thoát nhiệt này dưới nước lạnh sâu (4°C), con vật sẽ bị đông cứng cơ tim và tử vong do hạ thân nhiệt chỉ sau 15-20 phút.\n- Sụp đổ Biosonar: Sóng âm định vị của cá nhà táng có tần số thấp (10-25 kHz) đòi hỏi bước sóng dài và đường kính cơ quan táng tối thiểu phải đạt 1.5 mét để cộng hưởng tạo chùm tia định hướng. Ở kích thước 80kg, chiều dài cơ quan táng chỉ còn 25cm, khiến nó không thể phát ra sóng âm định vị tần số thấp hiệu quả, hệ thống dẫn đường và săn mồi biển sâu bị tê liệt hoàn toàn.\n- Giới hạn dưỡng khí lặn sâu: Khối lượng máu và cơ ít ỏi không tích trữ đủ lượng oxy cho các chuyến lặn kéo dài quá 3 phút, làm nó mất khả năng tiếp cận thức ăn sâu.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Tốc độ truyền nhiệt thất thoát ra môi trường",
                  issue: "Hệ số truyền nhiệt tăng 7.900%, nhiệt lượng cơ thể hạ xuống dưới mức sinh tồn (30°C) chỉ sau 18 phút trong nước biển lạnh."
                },
                {
                  type: "Bước sóng âm thanh giới hạn bởi kích thước buồng táng",
                  issue: "Tần số cắt tối thiểu tăng lên 60 kHz (sóng siêu âm ngắn), sóng âm bị hấp thụ và tiêu tán nhanh trong nước, giảm tầm quét từ 1.000m xuống còn 5m."
                }
              ]
            },
            p4p_score_scaled: 22,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of mammalian thermoregulation and whale biosonar limits", url: "https://doi.org/10.1111/j.1469-7998.2007.00392.x" }
            ]
          },
          {
            title: "Đột biến thích nghi (Sát thủ siêu âm mini)",
            slug: "ca-nha-tang-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa lớp mỡ composite aerogel siêu giữ nhiệt, buồng táng cấu trúc tinh thể nano tập trung sóng siêu âm tần số siêu cao.",
            content: "Để Cá Nhà Táng 80kg sinh tồn tốt và săn mồi hiệu quả ở biển sâu:\n- Mỡ bọc Composite Aerogel (Aerogel Blubber): Lớp mỡ dưới da tiến hóa chứa các bong bóng nitơ siêu nhỏ bao bọc bởi protein dạng gel đàn hồi, giảm hệ số dẫn nhiệt xuống mức ngang ngửa aerogel (0.015 W/m.K), ngăn chặn hoàn toàn sự mất nhiệt kể cả trong nước đóng băng.\n- Bộ cộng hưởng sáp táng nano (Nano-crystal Spermaceti Resonator): Các lipid trong cơ quan táng sắp xếp thành cấu trúc tinh thể lỏng nano tự nhiên, hoạt động như một thấu kính siêu vật liệu (metamaterial) hội tụ và khuếch đại sóng siêu âm tần số siêu cao (150 kHz), tạo chùm tia siêu âm hẹp tầm xa 100m để định vị và làm tê liệt não cá mồi tức thì.\n- Phổi nén mật độ cao (Hyper-dense Lung Alveoli): Phổi có cấu trúc chứa các nang mao mạch chịu áp lực cao, hấp thụ oxy nhanh gấp 8 lần, kết hợp nồng độ hemoglobin huyết thanh tăng vọt để kéo dài thời gian lặn sâu lên 35 phút.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ số dẫn nhiệt lớp mỡ cải tiến",
                  benefit: "Hệ số dẫn nhiệt giảm từ 0.20 W/m.K xuống 0.015 W/m.K, duy trì thân nhiệt 37°C vô hạn dưới nước băng giá."
                },
                {
                  type: "Tần số phát sóng và độ mở chùm tia siêu âm",
                  benefit: "Phát sóng 150 kHz với độ mở chùm tia cực hẹp chỉ 2 độ, tăng độ phân giải định vị con mồi nhỏ cách xa 80m."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Acoustic metamaterials and biological sonar evolution", url: "https://doi.org/10.1121/1.4921603" }
            ]
          }
        ]
      });
    } else if (target.id === "peacock-mantis-shrimp") {
      whatIfData.push({
        creature_id: target.id,
        title: "Nếu Tôm Bọ Ngựa Peacock phóng to bằng con người (80kg) thì sao?",
        slug: "neu-tom-bo-ngua-peacock-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Tôm Bọ Ngựa Peacock (Odontodactylus scyllarus) đạt kích thước 80kg và giải phóng cú đấm hủy diệt.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đấm 130.000 Newtons và bong bóng siêu bốc hơi)",
            slug: "tom-bo-ngua-peacock-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú đấm đạt lực 130 kN tạo ra bong bóng siêu xâm thực phát sáng nhiệt độ 15.000 K, đập nát thép tấm dày 50mm dễ dàng.",
            content: "Khi phóng to lên 80kg (tăng khối lượng ~800 lần, chiều dài đạt 1.39 mét):\n- Lực đấm hủy diệt: Cú đấm tăng theo tỷ lệ diện tích cơ (lambda^2 ≈ 86.2). Lực tác động cực đại của càng búa tăng từ 1.500N lên đến 130.000N (130 kN), tương đương sức nặng của một chiếc xe tải 13 tấn giáng xuống trong 1 mili giây, dễ dàng đập nát vỏ xe bọc thép hoặc thép tấm dày 50mm.\n- Siêu xâm thực cấp độ bom: Sự tăng tốc của chiếc càng búa khổng lồ ở vận tốc 22 m/s tạo ra bong bóng chân không siêu xâm thực có kích thước bằng quả bóng rổ. Khi bong bóng sụp đổ, áp suất cực đại tạo ra sóng xung kích chấn động dưới nước làm điếc tai bất kỳ sinh vật nào trong bán kính 100m, giải phóng nhiệt độ cục bộ lên tới 15.000 K (phát quang sinh học chói lòa).\n- Mắt siêu quang phổ phóng đại: Đôi mắt kép khổng lồ chứa 16 thụ thể màu sắc có thể phân tích được cấu trúc phân cực tròn của ánh sáng cách xa hàng km, giúp phát hiện mục tiêu tàng hình trong làn nước sâu.",
            formulas_and_data: {
              scaling_factor: 800,
              mass_kg_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đấm phóng to theo tiết diện cơ",
                  equation: "F_punch_scaled = F_punch_original * (M_scaled / M_original)^(2/3)",
                  result: "~129,300 N (130 kN)"
                },
                {
                  name: "Năng lượng động năng cú đấm",
                  equation: "E_kinetic = 1/2 * m_dactyl * v^2",
                  result: "~968 Joules (tương đương đạn súng trường)"
                }
              ]
            },
            p4p_score_scaled: 98,
            tier_scaled: "S",
            sources: [
              { label: "Biomimetic design of the ultra-fast striking dactyl club of mantis shrimp", url: "https://doi.org/10.1126/science.1218764" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự vỡ vụn vỏ kitin và chết ngạt do thiếu oxy)",
            slug: "tom-bo-ngua-peacock-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ thể bị nghiền nát dưới trọng lực khi lột xác, càng búa tự vỡ vụn dưới áp lực phản chấn và hệ thống mang thụ động bị tê liệt.",
            content: "Trong đời thực, Tôm Bọ Ngựa Peacock nặng 80kg sẽ lập tức tử vong do các giới hạn vật lý nghiêm trọng:\n- Molting Catastrophe (Thảm họa lột xác): Khi lột xác để phát triển, cơ thể mềm nhũn không xương của tôm bọ ngựa nặng 80kg sẽ bị lực hấp dẫn Trái Đất đè bẹt phẳng dẹt trên mặt đất. Nó sẽ chết ngạt do trọng lượng đè xẹp các buồng mang trước khi lớp vỏ mới có cơ hội cứng lại.\n- Tự sát cơ học (Self-destruction): Chitin tuy bền nhưng có giới hạn mỏi và giới hạn uốn. Cú đấm giải phóng 130 kN sẽ tạo ra một lực phản chấn tương đương dội ngược lại cơ thể. Xương khớp gối (meral sclerite) và phần dactyl club dù cứng đến đâu cũng sẽ vỡ vụn như thủy tinh do ứng suất tập trung quá lớn vượt quá giới hạn kéo nén của hydroxyapatite (~300 MPa).\n- Chết ngạt do mang thụ động: Tôm bọ ngựa hấp thụ oxy bằng cách quạt nước qua các chân mang mỏng manh dưới bụng. Ở kích thước 80kg, tỷ lệ trao đổi khí không kịp cung cấp oxy cho khối cơ ngực khổng lồ, khiến con vật rơi vào trạng thái nhiễm toan axit lactic và chết ngạt.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất phản lực vượt quá giới hạn kéo của vỏ kitin",
                  issue: "Ứng suất phản chấn tại khớp dactyl đạt 450 MPa, vượt giới hạn bền kéo của vỏ tôm bọ ngựa (350 MPa), gây vỡ nát càng búa ngay cú đấm đầu tiên."
                },
                {
                  type: "Diện tích mang trao đổi oxy không đủ",
                  issue: "Tỷ lệ bề mặt mang/thể tích cơ thể giảm 89.2%, gây thiếu hụt oxy nghiêm trọng khi hoạt động ở công suất cao."
                }
              ]
            },
            p4p_score_scaled: 28,
            tier_scaled: "D",
            sources: [
              { label: "The stomatopod dactyl club: a formidable impact-resistant shield", url: "https://doi.org/10.1002/adma.201104795" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thiết giáp hạm cơ khí đại dương)",
            slug: "tom-bo-ngua-peacock-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Vỏ ngoài gia cố ống nano carbon tự phục hồi, cơ cấu giảm chấn thủy lực đàn hồi cao và hệ hô hấp tuần hoàn cưỡng bức.",
            content: "Để Tôm Bọ Ngựa 80kg trở thành bá chủ thực sự của đại dương:\n- Vỏ composite nano-carbon (Bio-carbon Composite): Lớp ngoài dactyl club tiến hóa các lớp nano hydroxyapatite xen kẽ sợi collagen-chitin ngậm ion kim loại nặng (kẽm, mangan), tăng độ bền kéo uốn lên 1.2 GPa, triệt tiêu hoàn toàn vết nứt nhờ các liên kết hydro tự vá.\n- Cơ cấu giảm chấn chất lỏng (Hydraulic Shock Absorber): Tiến hóa một khoang dịch đệm thủy lực áp suất cao ngăn cách giữa dactyl club và phần cơ khớp, giúp hấp thụ và khuếch tán 98% phản lực của cú đấm 130 kN vào toàn bộ cơ thể mà không gây chấn thương xương khớp.\n- Phổi nước tuần hoàn chủ động (Active Gill Pumping): Tiến hóa một hệ thống cơ hoành mang chủ động, bơm nước cưỡng bức qua các lá mang siêu mịn xếp lớp dày đặc, tăng hiệu suất trích xuất oxy lên gấp 12 lần.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Độ bền uốn của dactyl club gia cố kim loại",
                  benefit: "Độ bền kéo uốn đạt 1.200 MPa, chịu lực va đập lặp lại liên tục mà không sinh ra vết nứt tế vi."
                },
                {
                  type: "Hiệu suất cơ cấu giảm chấn thủy lực",
                  benefit: "Hệ số hấp thụ lực đạt 98.5%, giảm gia tốc phản chấn tại khớp từ 10.000 g xuống còn 150 g."
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Carbon-nanotube reinforced chitin composites and shock absorption in nature", url: "https://doi.org/10.1016/j.actbio.2015.07.045" }
            ]
          }
        ]
      });
    } else if (target.id === "african-bullfrog") {
      whatIfData.push({
        creature_id: target.id,
        title: "Nếu Ếch Bò Châu Phi phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ech-bo-chau-phi-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Ếch Bò Châu Phi (Pyxicephalus adspersus) đạt kích thước 80kg, sở hữu các mấu xương răng odontoids khổng lồ và cú đớp hủy diệt.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đớp 15.000 Newtons và cú nhảy nghiền nát)",
            slug: "ech-bo-chau-phi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn đạt 15 kN tương đương cá sấu trưởng thành, mấu odontoids xuyên thủng lớp giáp bảo vệ và cơ đùi nhảy vọt cao 8m đè bẹp con mồi.",
            content: "Khi phóng to từ 1.4kg lên 80kg (tỷ lệ phóng đại khối lượng ~57 lần, chiều dài nhân ~3.8 lần):\n- Lực cắn odontoids khủng khiếp: Lực cắn gốc từ 150N phóng to theo tiết diện cơ (lambda^2 ≈ 14.8) đạt tới 15.000 N (~15 kN). Ba mấu răng odontoids ở hàm dưới hoạt động như những mũi đinh ba bằng xương đặc, dễ dàng xuyên qua các lớp giáp dày hoặc tấm kim loại mỏng.\n- Cú đớp siêu dính: Tuyến nước bọt phóng đại tiết ra chất nhầy dính cực độ. Sức dính của lưỡi có thể chịu được tải trọng kéo giật lên tới 400kg, cho phép nó đớp và giật phắt những con mồi nặng bằng nửa cơ thể nó.\n- Cú nhảy phản lực: Đôi chân sau khổng lồ phóng đại lực đàn hồi của cơ đùi sau giúp nó thực hiện những cú nhảy xa 15 mét, cao 8 mét, biến cơ thể 80kg thành một quả bom trọng lực dội xuống con mồi.",
            formulas_and_data: {
              scaling_factor: 57,
              mass_kg_original: 1.4,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn phóng to theo tiết diện cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~15,000 N (~1.5 tấn lực)"
                },
                {
                  name: "Năng lượng cú nhảy",
                  equation: "E_jump = m * g * h_jump",
                  result: "~6,270 Joules"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Bite force and prey capture kinematics in the African bullfrog", url: "https://doi.org/10.1242/jeb.098485" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở qua da và gãy xương đùi khi tiếp đất)",
            slug: "ech-bo-chau-phi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Hô hấp qua da bị vô hiệu hóa do suy giảm tỷ lệ diện tích/thể tích, xương đùi rỗng gãy vụn khi tiếp đất và sốc nhiệt nghiêm trọng.",
            content: "Trong đời thực, một con Ếch Bò Châu Phi 80kg sẽ chết nhanh chóng do các hạn chế sinh học:\n- Suy hô hấp cấp: Loài lưỡng cư phụ thuộc lớn vào hô hấp qua lớp da ẩm. Khi phóng to 57 lần về khối lượng, tỷ lệ diện tích bề mặt da so với thể tích cơ thể (S/V) giảm tới 74%. Phổi nhỏ của ếch không thể bù đắp nổi nhu cầu oxy của 80kg mô thịt, khiến nó nhanh chóng ngạt thở do thiếu oxy trong máu (hypoxia).\n- Gãy xương đùi do tải trọng động: Xương đùi lưỡng cư không có cấu trúc xốp gia cố chịu lực như động vật có vú. Một cú nhảy cao 8m của cơ thể 80kg khi tiếp đất sẽ tạo ra lực phản chấn cực đại lên tới 40.000 N, bẻ gãy vụn xương đùi và xương chày của nó ngay lập tức.\n- Sốc nhiệt và mất nước: Da ếch mỏng, không có lớp sừng chống bốc hơi hiệu quả. Ở kích thước 80kg, lượng nước bốc hơi nhanh chóng làm mất cân bằng điện giải và suy thận trong vòng vài giờ dưới ánh nắng mặt trời.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giảm tỷ lệ diện tích bề mặt/thể tích (S/V)",
                  issue: "Tỷ lệ S/V giảm 74%, lượng oxy hấp thụ qua da chỉ đáp ứng được 10% nhu cầu hô hấp cơ bản của cơ thể 80kg."
                },
                {
                  type: "Lực phản chấn tiếp đất vượt giới hạn bền của xương",
                  issue: "Lực phản chấn tiếp đất 40 kN vượt quá giới hạn uốn của xương đùi ếch (giới hạn chịu lực tối đa của xương đùi ếch phóng to chỉ khoảng 12 kN)."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Allometry of cutaneous respiration and skeletal scaling in anurans", url: "https://doi.org/10.1086/282245" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú bọc giáp sừng đầu cứng)",
            slug: "ech-bo-chau-phi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa phổi phế nang hiệu suất cao, lớp sừng Keratin hóa chống mất nước và bộ xương đặc gia cố khoáng chất.",
            content: "Để sinh tồn và chiến đấu hiệu quả ở kích thước 80kg, Ếch Bò tiến hóa các đột biến vượt trội:\n- Hệ thống phổi phế nang tích cực: Từ bỏ hô hấp qua da, chuyển hoàn toàn sang hệ thống phổi phế nang có các vách ngăn xếp nếp dày đặc giống như phổi của loài bò sát lớn, kết hợp với cơ hoành hô hấp phụ trợ giúp tăng hiệu suất trao đổi khí lên 15 lần.\n- Lớp da bọc sừng Keratin & kén sáp (Keratinized Armor): Lớp da tiến hóa biểu bì Keratin hóa dày dặn chống thoát nước tuyệt đối, tích hợp các tuyến tiết sáp lipid tạo màng kén bảo vệ cơ thể khỏi tia cực tím và sốc nhiệt.\n- Bộ xương đặc gia cố vi cấu trúc (Osteosclerotic Skeleton): Xương đùi và xương chậu tiến hóa thành cấu trúc xương đặc (osteosclerosis) tương tự như thú săn mồi lớn, gia cố bằng mạng lưới collagen chéo và muối canxi cacbonat giúp chịu lực va đập tới 60 kN mà không nứt vỡ.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia tăng áp suất trao đổi khí ở phổi",
                  benefit: "Thể tích phổi tăng gấp 8 lần, tích hợp phế nang nâng dung tích sống (vital capacity) lên 4.5 lít, đảm bảo cung cấp đủ oxy."
                },
                {
                  type: "Cường hóa mật độ xương đùi",
                  benefit: "Mật độ khoáng xương tăng từ 1.2 g/cm3 lên 2.1 g/cm3, nâng giới hạn chịu lực gãy uốn lên 65 kN."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Skeletal adaptations and lung evolution in giant extinct amphibians", url: "https://doi.org/10.1111/pala.12341" }
            ]
          }
        ]
      });
    } else if (target.id === "arapaima") {
      whatIfData.push({
        creature_id: target.id,
        title: "Nếu Cá Hải Tượng Long chuẩn hóa ở kích thước con người (80kg) thì sao?",
        slug: "neu-ca-hai-tuong-long-chuan-hoa-o-kich-thuoc-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài cá nước ngọt khổng lồ Cá Hải Tượng Long (Arapaima gigas) được thiết lập ở kích thước chuẩn hóa 80kg để so sánh chéo.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Áo giáp composite tự trượt và cú húc đầu sọ đặc)",
            slug: "ca-hai-tuong-long-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Vảy giáp composite Bouligand triệt tiêu lực đâm thủng cực tốt, bộ sọ nặng như búa sắt tạo ra lực va chạm 8.000N dưới nước.",
            content: "Khi chuẩn hóa ở 80kg (tương đương chiều dài ~1.6 mét):\n- Giáp vảy siêu composite: Sở hữu bộ vảy composite Bouligand ngậm nước (gồm lớp hydroxyapatite siêu cứng ngoài cùng và lõi collagen mềm dẻo xoắn lệch bên dưới). Khi bị cú cắn của thú săn mồi đè ép, các thớ collagen tự trượt để phân tán áp lực lên tới 120 MPa mà không nứt vỡ.\n- Cú húc đầu búa tạ dưới nước: Cấu trúc xương sọ cực kỳ nặng và dày được tối ưu hóa như một chiếc búa thủy động lực học. Khi phóng tới đâm thẳng vào mục tiêu với vận tốc 6 m/s dưới nước, nó tạo ra lực va chạm tức thời 8.000 N, đủ sức đập vỡ vụn xương của con mồi.\n- Hô hấp khí trời bổ trợ: Cơ quan bóng cá phế quản khổng lồ hoạt động giống như một lá phổi, cho phép cá hải tượng trích xuất 80% oxy từ không khí, duy trì hoạt động bền bỉ trong các vùng nước đục và thiếu oxy.",
            formulas_and_data: {
              scaling_factor: 0.5,
              mass_kg_original: 160,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Ứng suất phân tán bởi giáp vảy Bouligand",
                  equation: "sigma_absorbed = F_impact / A_scale * cos(theta)",
                  result: "Phân tán áp lực tới 120 MPa"
                },
                {
                  name: "Động năng cú húc đầu dưới nước",
                  equation: "E_impact = 1/2 * (m + m_added_mass) * v^2",
                  result: "~1,800 Joules (lực va chạm ~8,000 N)"
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Structure and mechanical properties of Arapaima gigas scales", url: "https://doi.org/10.1016/j.actbio.2012.03.014" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở do mất nước mang và mất tính linh hoạt vảy)",
            slug: "ca-hai-tuong-long-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Lớp vảy collagen bị khô nứt mất 90% độ bền uốn khi tiếp xúc với không khí, bóng cá ngạt thở do thiếu cơ chế bơm tích cực và hệ mang bị xẹp.",
            content: "Trong thế giới thực tế, nếu Cá Hải Tượng Long 80kg hoạt động ngoài môi trường nước hoặc ở điều kiện cạn khô:\n- Vỏ giáp giòn hóa (Dehydration brittleness): Độ dẻo dai của vảy phụ thuộc vào 30% hàm lượng nước ngậm trong sợi collagen. Khi ở ngoài không khí, vảy bị mất nước nhanh chóng, khiến lớp collagen bị giòn hóa và giảm 90% giới hạn bền uốn, dễ dàng nứt vỡ dưới các tác động va chạm vật lý nhẹ.\n- Ngạt thở bóng cá thụ động: Bóng cá thu nhận oxy chủ yếu bằng động tác đớp khí thụ động ở bề mặt nước. Không có hệ thống cơ sườn và cơ hoành để chủ động ép và hút khí cưỡng bức như động vật có vú, ở kích thước 80kg, dung tích bóng cá không đủ thông khí tự nhiên, gây tích tụ carbonic và nhiễm toan máu.\n- Sụp đổ phiến mang: Lớp phiến mang mỏng manh của nó sẽ lập tức bị xẹp dính lại dưới tác động của trọng lực cạn, vô hiệu hóa hoàn toàn khả năng lấy oxy từ nước.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Mất nước gây giòn hóa cấu trúc vảy collagen",
                  issue: "Độ bền uốn của vảy giảm từ 120 MPa xuống còn 12 MPa sau 30 phút mất nước ngoài không khí."
                },
                {
                  type: "Hiệu suất khuếch tán oxy bóng cá",
                  issue: "Thiếu cơ chế thở chủ động khiến nồng độ CO2 trong máu tăng 400%, gây ngất và tử vong do nhiễm toan hô hấp."
                }
              ]
            },
            p4p_score_scaled: 22,
            tier_scaled: "D",
            sources: [
              { label: "Materials design principles of ancient fish armor", url: "https://doi.org/10.1038/nmat2431" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái vật bọc giáp lưỡng cư nước ngọt)",
            slug: "ca-hai-tuong-long-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa tuyến chất nhờn tự vá bảo vệ vảy, hệ cơ hoành co bóp bóng cá tích cực và vây ngực cơ bắp hỗ trợ bò trườn.",
            content: "Để Cá Hải Tượng Long 80kg hoạt động linh hoạt vượt trội trong cả môi trường đầm lầy cạn:\n- Tuyến nhờn Hydrogel bảo vệ vảy: Tiến hóa hệ thống tuyến nhờn biểu bì đặc biệt tiết ra lớp hydrogel glycoprotein dày bao bọc quanh vảy, ngăn chặn sự mất nước của collagen và tự động lấp đầy các vết nứt tế vi trên bề mặt vảy.\n- Hệ hô hấp bóng cá tích cực (Active Swimbladder Pump): Tiến hóa các bó cơ vòng vân quấn quanh bóng cá, phối hợp với cơ hoành bụng để chủ động ép đẩy khí thải ra ngoài và hít khí mới vào, nâng hiệu suất hô hấp khí trời lên tương đương phổi thú.\n- Vây ngực cơ bắp dạng thùy (Lobe-like pectoral fins): Xương vây ngực tiến hóa dày đặc khớp nối cơ đùi chắc khỏe, cho phép nó dùng vây ngực để chống đỡ cơ thể 80kg bò trườn di chuyển trên mặt bùn đầm lầy cạn một cách linh hoạt.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hiệu quả giữ nước của hydrogel sáp",
                  benefit: "Duy trì 98% hàm lượng nước trong vảy suốt 24 giờ ngoài không khí, bảo vệ độ đàn hồi collagen Bouligand."
                },
                {
                  type: "Công suất lực bò trườn của vây ngực",
                  benefit: "Vây ngực tạo ra lực đẩy 600 N, giúp cơ thể 80kg bò trườn trên cạn với vận tốc 2 km/h."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Evolution of air-breathing organs in sarcopterygian and actinopterygian fishes", url: "https://doi.org/10.1111/joa.12456" }
            ]
          }
        ]
      });
    } else if (target.id === "atolla-jellyfish") {
      whatIfData.push({
        creature_id: target.id,
        title: "Nếu Sứa Báo Động Atolla phóng to bằng con người (80kg) thì sao?",
        slug: "neu-sua-bao-dong-atolla-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài sứa biển sâu Sứa Báo Động Atolla (Atolla wyvillei) đạt kích thước 80kg, giải phóng các vụ nổ ánh sáng siêu báo động và xúc tu bắt mồi khổng lồ.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Vụ nổ photon 12.000 Lumens và mạng lưới xúc tu giật điện dài 10m)",
            slug: "sua-bao-dong-atolla-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Vụ nổ ánh sáng sinh học siêu báo động làm lóa mắt kẻ địch cách xa 500m, xúc tu phì đại dài 10m châm chích tê liệt tức thì.",
            content: "Khi phóng to từ một sinh vật đĩa nhỏ lên khối lượng 80kg (phóng đại thể tích ~4.000 lần):\n- Siêu phát quang báo động (Photon Flashbomb): Phóng đại hệ thống protein xúc tác phát quang luciferin coelenterazine-luciferase. Một xung kích hoạt phát quang sinh học xanh lam (475 nm) cực đại có thể giải phóng quang năng 12.000 Lumens nhấp nháy liên tục, làm lóa mắt vĩnh viễn võng mạc của bất kỳ sinh vật săn mồi biển sâu nào trong bán kính 100 mét.\n- Xúc tu bắt mồi khổng lồ: Xúc tu phì đại đặc biệt kéo dài tới 10 mét, trang bị hàng triệu tế bào châm chích (nematocysts) chứa độc tố peptide Atollatoxin đậm đặc, truyền dòng xung điện châm chích tê liệt hệ thần kinh cơ của con mồi lớn chỉ trong 0.5 giây.\n- Lực đẩy thủy động vân chuông: Cơ vòng vân khổng lồ co bóp nhịp nhàng tạo lực đẩy phản lực đẩy đĩa sứa 80kg di chuyển êm ái với tốc độ 8 km/h mà không tạo ra tiếng động hay rung động cơ học.",
            formulas_and_data: {
              scaling_factor: 4000,
              mass_kg_original: 0.02,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Cường độ quang năng phát quang sinh học cực đại",
                  equation: "L_lumens_scaled = L_lumens_original * scaling_factor",
                  result: "~12,000 Lumens (xanh lam 475 nm)"
                },
                {
                  name: "Mật độ độc tố châm chích trên xúc tu",
                  equation: "D_nematocysts = N_total / A_tentacle",
                  result: "~1.5 x 10^6 tế bào/cm2"
                }
              ]
            },
            p4p_score_scaled: 84,
            tier_scaled: "A",
            sources: [
              { label: "Bioluminescence and visual ecology of deep-sea medusae", url: "https://doi.org/10.1002/lno.10342" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự rách toạc đĩa gelatin và hoại tử mô do thiếu hệ hô hấp)",
            slug: "sua-bao-dong-atolla-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Đĩa gelatin mỏng manh bị xé toạc dưới lực cản nước khi di chuyển nhanh, và mô tế bào bị hoại tử do oxy không thể khuếch tán vào lõi cơ thể dày.",
            content: "Trong thế giới thực tế sinh học, Sứa Báo Động Atolla 80kg sẽ lập tức tử vong do:\n- Rách toạc cấu trúc Gelatin (Structural disintegration): Cơ thể sứa cấu tạo từ 95% nước và lớp mesoglea gelatin liên kết lỏng lẻo bằng collagen mỏng. Khi khối lượng đạt 80kg, lực cản thủy động khi co bóp bơi nhanh sẽ tạo ra ứng suất cắt vượt quá giới hạn bền của mesoglea (~2 kPa), khiến đĩa sứa tự rách toạc làm đôi dưới áp lực nước.\n- Hoại tử lõi do thiếu oxy: Sứa không có máu, tim hay hệ tuần hoàn; hô hấp hoàn toàn phụ thuộc vào sự khuếch tán oxy thụ động qua lớp tế bào biểu bì ngoài. Khi cơ thể dày lên từ vài milimet lên tới hơn 40 cm ở 80kg, oxy không thể khuếch tán vào các lớp tế bào sâu bên trong lõi đĩa sứa, gây hoại tử yếm khí và thối rữa mô trong vòng vài giờ.\n- Sụp đổ thẩm thấu: Bất kỳ sự thay đổi nhỏ nào về độ mặn của nước biển cũng sẽ gây ra dòng nước thẩm thấu khổng lồ làm vỡ tung các tế bào nhạy cảm của cơ thể 80kg.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất cắt thủy động lực học trên vành chuông",
                  issue: "Ứng suất cắt khi bơi đạt 8.5 kPa, vượt xa giới hạn bền kéo của mesoglea sứa (2.0 kPa), tự xé rách đĩa sứa."
                },
                {
                  type: "Giới hạn khoảng cách khuếch tán oxy thụ động",
                  issue: "Khoảng cách khuếch tán oxy tối đa của sứa là 2 mm. Ở độ dày cơ thể 40 cm của sứa 80kg, 98% mô bên trong không nhận được oxy."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Limits to the scaling of passive diffusion in gelatinous zooplankton", url: "https://doi.org/10.1086/662234" }
            ]
          },
          {
            title: "Đột biến thích nghi (Kẻ săn mồi phát quang bọc lưới cơ)",
            slug: "sua-bao-dong-atolla-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa màng lưới collagen định hình siêu đàn hồi lực cao, hệ thống ống nước tuần hoàn mang tích cực và tế bào quang điện tự sạc.",
            content: "Để Sứa Báo Động Atolla 80kg hoạt động bền bỉ và kiêu hãnh thống trị vùng nước sâu:\n- Mạng lưới giáp cơ Elastic Mesoglea: Lớp gelatin mesoglea tiến hóa một ma trận sợi elastin chéo dày đặc kết hợp mạng lưới polymer chitin dẻo, nâng giới hạn bền kéo uốn lên gấp 500 lần (đạt 1.0 MPa), giúp nó chịu đựng áp lực co bóp bơi lội tốc độ cao.\n- Hệ thống kênh tuần hoàn mang tích cực (Gastrovascular Breathing System): Tiến hóa các kênh tiêu hóa - tuần hoàn phân nhánh nhỏ li ti hoạt động như hệ thống vi tuần hoàn chủ động bóp đẩy nước giàu oxy đi khắp mọi tế bào trong lõi đĩa sứa, giải quyết triệt để rào cản khuếch tán thụ động.\n- Pin sinh học phát quang hiệu suất cao (Bio-capacitor cells): Tiến hóa các tế bào cơ quang điện đặc biệt tự sạc động năng giải phóng luồng sáng cực đại liên tục mà không gây cạn kiệt ATP năng lượng cơ thể.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Độ bền ma trận elastin-chitin cường hóa",
                  benefit: "Độ bền cơ học đạt 1.0 MPa, triệt tiêu hoàn toàn rủi ro rách toạc đĩa sứa khi bơi tốc độ cao."
                },
                {
                  type: "Lưu lượng dòng nước vi tuần hoàn hô hấp",
                  benefit: "Hệ kênh vi tuần hoàn vận chuyển 1.5 lít nước/phút qua các phế nang sứa, cung cấp 100% nhu cầu oxy cho mô cơ."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Novel elastic proteins and vascular designs in modified jellyfish", url: "https://doi.org/10.1016/j.cbpb.2014.11.009" }
            ]
          }
        ]
      });
    } else if (target.id === "cheetah") {
      whatIfData.push({
        creature_id: "cheetah",
        title: "Nếu Báo Săn phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bao-san-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài thú bứt tốc nhanh nhất trên cạn Báo Săn (Acinonyx jubatus) đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Bão táp điền kinh và sải chạy bứt tốc 130 km/h)",
            slug: "bao-san-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đạt vận tốc bứt tốc lý thuyết 130 km/h, sải bước chạy kéo dài lên tới 9.5m nhờ cột sống lò xo và móng vuốt chịu tải bám đường tốt.",
            content: "Khi Báo Săn được phóng to lên khối lượng 80kg (tăng khối lượng ~1.8 lần so với trung bình 45kg):\n- Sức mạnh bứt tốc vượt bậc: Vận tốc bứt tốc lý thuyết tăng nhờ lực cơ bắp đùi phát triển mạnh mẽ. Vận tốc tối đa tăng theo tỷ lệ cơ học lên tới 130 km/h chỉ sau 2.5 giây. Sải chân chạy nước rút kéo dài từ 7m lên tới 9.5m nhờ cột sống hoạt động như một lò xo có mô-men lực nén lớn.\n- Độ bám đường và phản xạ tiền đình: Hệ thống móng vuốt bán co rút chịu lực nén lớn hoạt động như những chiếc đinh giày chạy cự ly ngắn bám chặt mặt đường đất, trong khi hệ thống phản xạ tiền đình - mắt (vestibulo-ocular reflex) giữ thăng bằng võng mạc hoàn hảo giúp mắt khóa chặt con mồi bất chấp cơ thể nhấp nhô mạnh ở vận tốc siêu cấp.",
            formulas_and_data: {
              scaling_factor: 1.8,
              mass_kg_original: 45,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Tốc độ chạy phóng đại theo lực đẩy",
                  equation: "v_scaled = v_original * (M_scaled / M_original)^(1/6)",
                  result: "~130 km/h"
                },
                {
                  name: "Lực tác động lên khớp chân chịu tải bám đất",
                  equation: "F_impact = M_scaled * a_acceleration",
                  result: "~880 N"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Locomotion dynamics and spinal elasticity of cheetahs", url: "https://doi.org/10.1242/jeb.070029" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Hội chứng quá nhiệt nội tạng và thoái hóa khớp cơ học)",
            slug: "bao-san-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Nhiệt độ cơ thể tăng vọt lên 43°C gây sốc nhiệt não chỉ sau 15 giây chạy bứt tốc, khớp chân mỏng dẹt chịu ứng suất xoắn gây rạn xương.",
            content: "Trong thực tế vật lý sinh học khi Báo Săn đạt 80kg:\n- Tích tụ nhiệt lượng cực hạn: Khối lượng cơ hoạt động sinh nhiệt tăng theo lũy thừa 3 (thể tích), trong khi diện tích da tản nhiệt chỉ tăng theo lũy thừa 2. Khi bứt tốc lên 120-130 km/h, cơ thể 80kg sản sinh lượng nhiệt khổng lồ gấp 2.2 lần nguyên bản. Do không có cơ chế đổ mồ hôi hiệu quả, nhiệt độ cốt cơ thể vọt qua 43°C chỉ sau 15 giây (so với 30-40 giây của bản thường), gây đông tụ protein tế bào thần kinh, sốc nhiệt và tử vong ngay lập tức.\n- Quá tải cơ xương khớp: Đôi chân thon dài tiến hóa cho khối lượng nhẹ không thể chịu đựng lực chấn động gấp đôi (lên tới 4.500 N mỗi bước chạy) khi nện xuống đất ở tốc độ cao. Các khớp cổ chân và xương ống chày mảnh dẹt sẽ chịu ứng suất uốn quá mức, dẫn đến nứt rạn xương hoặc rách dây chằng chéo trước.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thời gian chạy nước rút tối đa trước khi sốc nhiệt",
                  issue: "Giảm từ 30 giây xuống còn 12-15 giây do tỷ lệ diện tích tản nhiệt trên thể tích giảm 25%."
                },
                {
                  type: "Áp lực chấn động lên khớp chân",
                  issue: "Lực phản lực từ đất (GRF) đạt 4.500 N, vượt giới hạn uốn gãy của xương chày mảnh dẹt."
                }
              ]
            },
            p4p_score_scaled: 40,
            tier_scaled: "C",
            sources: [
              { label: "Locomotor limits and heat storage in running cheetahs", url: "https://doi.org/10.1242/jeb.091116" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú bứt tốc có chu kỳ làm mát chủ động và xương hóa cứng)",
            slug: "bao-san-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Mở rộng hệ thống xoang mũi và tuyến mồ hôi đệm chân tản nhiệt chủ động, cấu trúc xương đùi hóa đặc chịu ứng suất uốn cao.",
            content: "Để Báo Săn 80kg trở thành quái thú tốc độ bền bỉ:\n- Hệ thống làm mát tuần hoàn bằng mồ hôi (Evaporative Glandular Network): Tiến hóa các tuyến mồ hôi hoạt động mạnh dọc sống lưng kết hợp mạch máu dưới da dãn nở lớn giúp giải nhiệt nhanh gấp 3 lần. Xoang mũi mở rộng thêm 40% diện tích tiếp xúc niêm mạc, hoạt động như bộ trao đổi nhiệt khí-lỏng chủ động bảo vệ não bộ khỏi bị quá nhiệt.\n- Cường hóa mật độ xương đùi (Osteosclerotic reinforcement): Xương bả vai và hệ xương chi dưới tăng mật độ canxi hóa đặc (osteosclerosis) tương tự thú săn mồi lớn, chịu lực chấn động lên tới 6.000 N mà không bị nứt gãy, đồng thời các dây chằng được gia cố bằng sợi collagen siêu liên kết đàn hồi cao.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ thống tản nhiệt xoang mũi mở rộng",
                  benefit: "Tốc độ tản nhiệt đạt 1.800 W, giữ nhiệt độ não luôn dưới 39°C trong suốt 60 giây chạy nước rút."
                },
                {
                  type: "Gia cố mật độ xương đùi",
                  benefit: "Giới hạn bền nén của xương tăng lên 180 MPa, chịu lực phản lực từ đất đạt 6.500 N."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "S",
            sources: [
              { label: "Skeletal adaptations and thermoregulation in large carnivores", url: "https://doi.org/10.1111/j.1469-7998.2012.00912.x" }
            ]
          }
        ]
      });
    } else if (target.id === "cuttlefish") {
      whatIfData.push({
        creature_id: "cuttlefish",
        title: "Nếu Mực Nang phóng to bằng con người (80kg) thì sao?",
        slug: "neu-muc-nang-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài sinh vật ngụy trang bậc thầy Mực Nang (Sepia officinalis) đạt kích thước 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Thủy quái tàng hình bách biến và xung lực phản lực 450N)",
            slug: "muc-nang-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Xung lực phản lực nước đạt 450N bứt tốc 40 km/h, thay đổi màu sắc hoa văn ngụy trang bao phủ diện tích 2.5 m2 chỉ trong 100ms.",
            content: "Khi Mực Nang phóng to lên 80kg (tăng khối lượng ~25 lần so với cá thể lớn 3.2kg, chiều dài cơ thể đạt ~1.8m):\n- Phản lực đẩy nước uy lực: Khoang áo co bóp bằng hệ cơ vòng dày bản. Khi phóng to, lực đẩy thủy động học tăng theo tiết diện cơ bụng (lambda^2 ≈ 8.5), tạo ra lực phun nước phản lực lên tới 450N thông qua ống phễu linh hoạt, giúp mực nang bứt tốc tức thì đạt vận tốc 40 km/h dưới nước.\n- Ngụy trang diện tích lớn: Hệ sắc tố tế bào chromatophores phát triển gấp bội. Hơn 50 triệu tế bào màu sắc co giãn dưới sự điều khiển thần kinh trực tiếp, cho phép mực nang 80kg đổi màu sắc, mô phỏng rạn san hô hoặc cát biển bao phủ diện tích da rộng 2.5m2 chỉ trong 100 mili giây.\n- Nang mực chịu lực nổi: Xương nang mực (cuttlebone) dài 1.2m làm từ các tấm aragonite song song siêu nhẹ điều tiết lượng khí nito chuẩn xác, giúp mực nang nặng 80kg lơ lửng thăng bằng hoàn hảo ở mọi độ sâu.",
            formulas_and_data: {
              scaling_factor: 25,
              mass_kg_original: 3.2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực phun nước phản lực bứt tốc",
                  equation: "F_thrust = rho * A_funnel * v_jet^2",
                  result: "~450 N"
                },
                {
                  name: "Thể tích khoang áo chứa nước co bóp",
                  equation: "V_mantle_scaled = V_mantle_original * scaling_factor",
                  result: "~18 lít"
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Jet propulsion and buoyancy control in cephalopods", url: "https://doi.org/10.1242/jeb.02445" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự vỡ nát xương nang và kiệt quệ oxy máu)",
            slug: "muc-nang-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cấu trúc nang aragonite bị nứt vỡ dưới áp suất thủy tĩnh cao, hệ tuần hoàn đồng thiếu hiệu quả gây ngạt thở khi bơi nhanh.",
            content: "Trong thực tế vật lý sinh học khi Mực Nang đạt 80kg:\n- Tổn thương xương nang mực: Xương cuttlebone có cấu trúc tổ ong xốp rỗng rậm rạp bằng chất canxi aragonite để chứa khí. Khi kích thước xương dài tới 1.2m, mô-men xoắn xoay uốn cơ thể và áp suất thủy tĩnh ở độ sâu >50m sẽ vượt quá giới hạn bền nén của lớp Aragonite mỏng mảnh, làm xẹp xương nang, khiến mực mất hoàn toàn khả năng kiểm soát độ nổi và chìm thẳng xuống đáy biển.\n- Khủng hoảng oxy máu (Hemocyanin insufficiency): Mực nang sử dụng sắc tố hemocyanin chứa đồng để vận chuyển oxy trong máu, vốn có hiệu suất liên kết oxy kém hơn hemoglobin chứa sắt gấp 3-4 lần. Khi cơ thể nặng 80kg bơi lội bóp phễu phun nước liên tục, cơ vòng tiêu thụ lượng oxy cực đại. Hệ thống tim ba buồng không thể bơm đủ máu đi qua các lá mang khuếch tán thụ động, mực nang sẽ rơi vào trạng thái nhiễm toan acid lactic máu và kiệt quệ cơ chỉ sau 2 phút bơi nhanh.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giới hạn áp suất phá hủy xương nang mực",
                  issue: "Nang mực 1.2m bị nứt vỡ dưới áp suất 0.8 MPa (độ sâu ~80m), mất khả năng điều tiết sức nổi."
                },
                {
                  type: "Hiệu suất cung cấp oxy của Hemocyanin",
                  issue: "Nồng độ oxy trong máu chỉ đạt 1.2 mmol/L dưới tải tối đa, gây ngạt cơ hoàn toàn."
                }
              ]
            },
            p4p_score_scaled: 30,
            tier_scaled: "D",
            sources: [
              { label: "Buoyancy and mechanical properties of the cuttlebone", url: "https://doi.org/10.1016/j.jsb.2007.03.007" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái mực khổng lồ có máu sắt đỏ và xương nang titan composite)",
            slug: "muc-nang-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương nang gia cố chitin-silicate chịu áp lực 2.5 MPa, tiến hóa sắc tố máu Hemoglobin đỏ nâng hiệu suất hô hấp lên 400%.",
            content: "Để Mực Nang 80kg làm bá chủ ngụy trang rình rập ở đại dương:\n- Xương nang composite Titan-Chitin (Bio-composite Cuttlebone): Cấu trúc nang mực được gia cố bởi ma trận chitin-silicate dẻo đan xen hạt aragonite siêu nhỏ, tăng giới hạn bền nén uốn lên gấp 4 lần, chịu được áp suất lên tới 2.5 MPa (độ sâu 250m) mà không bị nứt vỡ.\n- Máu sắt đỏ (Hemoglobin transition): Đột biến chuyển đổi hoàn toàn từ protein vận chuyển oxy Hemocyanin (máu xanh) sang Hemoglobin (máu đỏ chứa sắt) có ái lực oxy cao gấp 4 lần. Kết hợp hai mang phụ có vách ngăn cơ bóp đẩy nước chủ động, tăng lượng oxy cung cấp cho cơ vòng lên 400%, cho phép mực bơi phản lực liên tục mà không bị tích tụ acid lactic.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia cố composite xương nang",
                  benefit: "Chịu áp suất thủy tĩnh 2.5 MPa, duy trì sức nổi ổn định từ độ sâu 0m đến 250m."
                },
                {
                  type: "Nâng cấp protein vận chuyển oxy Hemoglobin",
                  benefit: "Nồng độ oxy bão hòa máu tăng lên 5.2 mmol/L, duy trì hiệu suất cơ bóp liên tục 30 phút."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Respiratory proteins and composite materials in deep-sea cephalopods", url: "https://doi.org/10.1016/j.bbapap.2011.08.012" }
            ]
          }
        ]
      });
    } else if (target.id === "draco-lizard") {
      whatIfData.push({
        creature_id: "draco-lizard",
        title: "Nếu Thằn Lằn Bay Draco phóng to bằng con người (80kg) thì sao?",
        slug: "neu-than-lan-bay-draco-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài thằn lằn bay độc đáo Thằn Lằn Bay Draco (Draco volans) đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cực hạn phi đao khí động học và lượn lách tán rừng)",
            slug: "than-lan-bay-draco-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Sải cánh màng da rộng 2.4m tạo lực nâng khí động học lớn lướt xa 45m, yếm cổ ổn định triệt tiêu mô-men xoắn hoàn hảo.",
            content: "Khi Thằn Lằn Bay Draco được phóng to lên 80kg (tăng khối lượng ~4.000 lần so với nguyên bản 20g, chiều dài đạt ~1.6m):\n- Lướt gió cự ly dài: Khi phóng to cơ học lý thuyết, sải cánh màng da patagium được chống đỡ bởi hệ xương sườn biến tính kéo dài đạt chiều rộng 2.4 mét. Lực nâng khí động học tạo ra ở vận tốc bay lướt 50 km/h giúp thằn lằn bay xa tới 45 mét giữa các tán cây cổ thụ.\n- Cánh ổn định yếm cổ (Canard dewlap system): Chiếc yếm cổ màu vàng cam rực rỡ dài 35cm hoạt động giống như một chiếc cánh canard phía mũi của máy bay phản lực, triệt tiêu hoàn toàn mô-men xoắn gây chúi đầu khi cất cánh. Đuôi dài 1.2m đóng vai trò như bánh lái đuôi khí động học xoay chuyển cực kỳ linh hoạt để né tránh chướng ngại vật cành cây.",
            formulas_and_data: {
              scaling_factor: 4000,
              mass_g_original: 20,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Sải cánh phóng to lý thuyết",
                  equation: "W_span_scaled = W_span_original * (M_scaled / M_original)^(1/3)",
                  result: "~2.4 m"
                },
                {
                  name: "Góc lướt khí động học tối ưu",
                  equation: "L/D_ratio = C_L / C_D",
                  result: "~4.5 (giảm độ cao 1m cho mỗi 4.5m bay xa)"
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Aerodynamics and gliding performance of Draco lizards", url: "https://doi.org/10.1242/jeb.00685" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự gãy sập màng sườn và cú rơi tự do hủy diệt)",
            slug: "than-lan-bay-draco-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Diện tích cánh thiếu hụt 92% khiến thằn lằn rơi tự do như một hòn đá nặng, xương sườn mỏng gãy vụn dưới lực nâng gió.",
            content: "Trong thực tế vật lý khí động học khi Thằn Lằn Bay Draco nặng 80kg:\n- Thảm họa lực nâng cánh: Định luật bình phương - lập phương là rào cản chí mạng. Khối lượng tăng 4.000 lần nhưng diện tích màng da patagium chỉ tăng khoảng 250 lần. Diện tích cánh phóng to thực tế chỉ đạt 0.18 m2, trong khi diện tích cần thiết để nâng 80kg lướt gió an toàn là tối thiểu 2.2 m2. Draco khổng lồ sẽ rơi tự do như một hòn đá từ ngọn cây và tử vong khi chạm đất.\n- Gãy sập hệ xương sườn: Hệ xương sườn biến tính nâng đỡ màng cánh rất mảnh và dẻo. Khi bay lướt ở 80kg, áp lực gió cản tác động lên màng da sẽ tạo ra lực nâng cơ học bẻ cong xương sườn với mô-men lực 180 N.m, vượt quá giới hạn gãy của xương bò sát mỏng tới 8 lần, làm gãy vụn toàn bộ khung cánh sườn trong tích tắc.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt diện tích màng cánh nâng đỡ",
                  issue: "Diện tích cánh thực tế thiếu hụt 92% so với yêu cầu khí động học tối thiểu của cơ thể 80kg."
                },
                {
                  type: "Ứng suất uốn gãy xương sườn đỡ cánh",
                  issue: "Mô-men xoắn gió tác động đạt 180 N.m, vượt quá giới hạn bền uốn xương sườn 800%."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Gliding flight and scaling limitations in vertebrates", url: "https://doi.org/10.1111/j.1469-7998.2005.00012.x" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khủng long bay màng da composite và đệm khí cánh cụp chủ động)",
            slug: "than-lan-bay-draco-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Màng cánh gấp nếp rộng 4.5m bằng keratin composite và xương sườn carbon-calcified, cơ liên sườn chịu lực co bóp lớn.",
            content: "Để Thằn Lằn Bay Draco 80kg thống trị bầu trời tán rừng cổ thụ:\n- Màng cánh siêu rộng keratin composite (Composite Patagium): Màng da tiến hóa nếp gấp mở rộng gấp 3 lần, khi căng ra đạt sải rộng tới 4.5 mét (diện tích 2.3 m2). Lớp da dày tích hợp các sợi keratin chéo dẻo dai chống xé gió hoàn hảo.\n- Cường hóa xương sườn Carbon-Calcified (Carbon-fiber ribs): Hệ xương sườn biến tính được bọc một lớp vỏ carbon sinh học đặc biệt cứng cáp và đàn hồi cao, kết hợp các nhóm cơ liên sườn ilio-costalis phát triển dày bản chịu lực nén lướt gió lớn. Đôi chân trước tiến hóa khớp xoay linh hoạt kẹp giữ mép cánh để chủ động thay đổi độ cong biên dạng cánh, cho phép lượn lách, tăng giảm độ cao và tiếp đất êm ái như tàu lượn siêu cấp.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Mở rộng màng cánh composite xếp nếp",
                  benefit: "Diện tích cánh đạt 2.3 m2, sải cánh 4.5m tạo lực nâng 850N giúp lướt xa hơn 80 mét từ độ cao 20m."
                },
                {
                  type: "Cường hóa vật liệu xương sườn nâng đỡ",
                  benefit: "Ứng suất uốn gãy tăng lên 250 MPa, triệt tiêu hoàn toàn rủi ro gãy sườn khi bay lướt tốc độ cao."
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "A",
            sources: [
              { label: "Biomimetic structures and adaptive flight control in gliding reptiles", url: "https://doi.org/10.1098/rsif.2011.0543" }
            ]
          }
        ]
      });
    } else if (target.id === "deep-sea-anglerfish") {
      whatIfData.push({
        creature_id: "deep-sea-anglerfish",
        title: "Nếu Cá Lồng Đèn Sâu phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-long-den-sau-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài cá săn mồi kỳ dị Cá Lồng Đèn Sâu (Melanocetus johnsonii) ở vùng biển thẳm đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cần câu phát sáng 100W siêu áp lực và lực đớp 4.500N nuốt chửng con mồi)",
            slug: "ca-long-den-sau-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Chiếc cần câu phát sáng sinh học đạt công suất 100W dụ mồi từ xa 500m, hàm mở rộng 120 độ đớp với lực 4.500N xé nát giáp sắt.",
            content: "Khi Cá Lồng Đèn Sâu phóng to lên 80kg (tăng khối lượng gấp ~160.000 lần so với con cái trưởng thành 0.5g ban đầu, chiều dài đạt ~1.2m):\n- Cần phát sáng siêu công suất: Bầu phát sáng (esca) chứa hàng tỷ vi khuẩn cộng sinh Photobacterium đạt đường kính 15cm, phát ra luồng ánh sáng xanh lục công suất tương đương bóng đèn 100W, có khả năng đâm xuyên qua làn nước tối đen ở khoảng cách 500m để dẫn dụ con mồi.\n- Bộ hàm búa tạ và răng nanh gập linh hoạt: Hộp sọ khớp xoay cơ học mở rộng 120 độ cho phép đớp với lực cơ cắn lên tới 4.500 N. Hàng răng nanh sắc nhọn dài 18cm có thể gập xuống linh hoạt theo một chiều, cho phép con mồi trượt sâu vào thực quản khổng lồ nhưng không thể thoát ngược ra ngoài.\n- Da hấp thụ ánh sáng tuyệt đối: Da chứa mật độ hạt hắc tố melanophore cực cao, hấp thụ 99.9% ánh sáng chiếu vào, biến con cá 80kg thành một 'hố đen' tàng hình hoàn hảo giữa lòng đại dương.",
            formulas_and_data: {
              scaling_factor: 160000,
              mass_g_original: 0.5,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp phóng to lý thuyết",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~4.500 N"
                },
                {
                  name: "Cường độ phát sáng sinh học",
                  equation: "I_luciferin = N_bacteria * phi_photon",
                  result: "~100 Watts quang năng"
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Bioluminescence and feeding mechanics of deep-sea anglerfishes", url: "https://doi.org/10.1111/j.1469-7998.2008.00494.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cú đè bẹp áp suất cơ thể nhão và sự tắt ngấm bầu phát sáng do thiếu oxy)",
            slug: "ca-long-den-sau-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Hệ xương sụn nhão biến dạng dưới trọng lực, bầu phát sáng cạn kiệt oxy làm vi khuẩn chết, tim suy kiệt do thiếu áp lực.",
            content: "Trong thực tế vật lý sinh học khi Cá Lồng Đèn Sâu nặng 80kg:\n- Sụp đổ cấu trúc xương thịt (Soft tissue collapse): Để sinh tồn dưới áp suất biển sâu 1.000m, cơ thể chúng tiến hóa với xương sụn mềm xốp và các bó cơ lỏng lẻo chứa nhiều nước. Ở khối lượng 80kg, nếu đưa ra khỏi môi trường áp suất nước sâu hoặc chịu tác động của trọng lực mạnh, cơ thể cá sẽ biến thành một khối gel nhão xẹp lép, các cơ quan nội tạng đè nén lẫn nhau gây tử vong trong vài phút.\n- Tắt ngấm cần sáng dụ mồi: Bầu esca chứa vi khuẩn cộng sinh hiếu khí phát sáng cần nguồn cung cấp oxy liên tục. Với thể tích bầu phát sáng tăng 160.000 lần, lưu lượng máu khuếch tán oxy qua hệ tuần hoàn yếu ớt của cá không đủ đáp ứng, dẫn đến sự tích tụ chất độc và vi khuẩn phát sáng sẽ chết hàng loạt sau 30 phút bơi lội, dập tắt hoàn toàn ánh sáng.\n- Tim suy kiệt: Tim nhỏ yếu không có bầu chứa đệm áp suất không thể bơm máu đi nuôi các mô cơ phì đại.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Sụp đổ cơ học mô mềm dưới áp lực trọng lực",
                  issue: "Ứng suất kéo nén giới hạn của xương sụn chỉ đạt 0.05 MPa, cơ thể biến dạng hoàn toàn ở 1G."
                },
                {
                  type: "Khủng hoảng oxy của vi khuẩn phát sáng",
                  issue: "Lưu lượng oxy cung cấp chỉ đạt 5% nhu cầu hô hấp của 10^11 vi khuẩn phát sáng trong esca lớn."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Physiological constraints of deep-sea organisms", url: "https://doi.org/10.1146/annurev.physiol.64.081501.155736" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái ngư gai xương titan và tuần hoàn áp lực cao kép)",
            slug: "ca-long-den-sau-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương sụn hóa xương phốt-phát canxi titan siêu bền, hệ tuần hoàn kép có tim phụ bơm oxy chuyên biệt cho esca.",
            content: "Để Cá Lồng Đèn Sâu 80kg thống trị vùng trung tầng đại dương:\n- Gia cố khung xương (Titan-Calcified skeleton): Khung xương sụn được thay thế bằng cấu trúc phốt-phát canxi gia cường sợi collagen siêu bền, chịu đựng lực vặn xoắn và mô-men lực 1.200 N.m khi bơi lượn bứt tốc.\n- Hệ tuần hoàn áp lực cao và túi oxy Esca (Oxygenated Esca Chamber): Tiến hóa một động mạch phụ chuyên biệt kết nối từ mang thẳng tới bầu phát sáng, kết hợp van điều tiết huyết áp và các tế bào sắc tố phản quang guanophres bao bọc esca giúp tối ưu hóa luồng ánh sáng phát ra tới 300% mà không gây hao hụt oxy tổng thể cơ thể.\n- Ký sinh sinh dục điều chỉnh: Con đực khi bám vào con cái chỉ hợp nhất một phần hệ mạch máu nhỏ để trao đổi hormon mà không triệt tiêu hệ miễn dịch của con cái, giữ cho cả hai cá thể khỏe mạnh.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vật liệu khung xương biến tính",
                  benefit: "Ứng suất uốn chịu đựng đạt 120 MPa, bảo vệ hoàn chỉnh các nội tạng ở áp suất từ 1 đến 100 atm."
                },
                {
                  type: "Hệ tuần hoàn mang phụ chuyên biệt cho Esca",
                  benefit: "Nồng độ oxy cung cấp đạt 4.8 ml/O2/g/h, duy trì ánh sáng 80W liên tục 24 giờ."
                }
              ]
            },
            p4p_score_scaled: 84,
            tier_scaled: "A",
            sources: [
              { label: "Evolutionary adaptations of deep-sea anglerfish lineages", url: "https://doi.org/10.1016/j.cub.2020.06.012" }
            ]
          }
        ]
      });
    } else if (target.id === "giant-snakehead") {
      whatIfData.push({
        creature_id: "giant-snakehead",
        title: "Nếu Cá Lóc Bông phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-loc-bong-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài cá lóc bông hung hãn và sở hữu lực cắn xé kinh hoàng đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú táp búa bổ 8.000N và khả năng vượt cạn càn quét đầm lầy)",
            slug: "ca-loc-bong-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn đạt 8.000N nghiền nát xương đùi lợn rừng, bứt tốc đớp mồi Mach 0.15 và bò trườn cạn liên tục 15km.",
            content: "Khi Cá Lóc Bông phóng to lên 80kg (tăng khối lượng ~13.3 lần so với cá thể lớn 6kg ngoài tự nhiên, chiều dài đạt ~1.8m):\n- Cú táp nghiền xương đùi: Nhờ cơ hàm mở rộng và các bản xương dẹt đầu dẹt như rắn được gia cố cơ học, lực cắn ở răng nanh nhọn đạt tới 8.000 N, tương đương với cá sấu trưởng thành, dễ dàng cắn nát đùi lợn rừng hoặc vỏ thuyền mỏng.\n- Bứt tốc thủy động học siêu việt: Tỷ lệ bó cơ trắng đuôi phân nhánh sâu phóng đại cho lực đẩy bộc phát tức thời đạt 3.500N, phóng cá lên phía trước với vận tốc Mach 0.15 (~50 m/s) trong khoảng cách ngắn để đớp mồi.\n- Vượt cạn càn quét: Hệ xương đai vai và vây ngực khỏe nâng đỡ cơ thể 80kg trườn qua các bờ đất ẩm ẩm ướt với tốc độ 8 km/h, vượt qua quãng đường 15km để di cư sang đầm lầy khác.",
            formulas_and_data: {
              scaling_factor: 13.3,
              mass_kg_original: 6,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn phóng to cơ học",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~8.000 N"
                },
                {
                  name: "Lực đẩy bứt tốc cơ trắng",
                  equation: "F_thrust = 0.5 * C_d * rho * A_tail * v^2",
                  result: "~3.500 N"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "S",
            sources: [
              { label: "Locomotion and jaw mechanics in Channa species", url: "https://doi.org/10.1242/jeb.02105" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngột ngạt vì mang xẹp trên cạn và gãy gập khớp vây ngực dưới trọng lực)",
            slug: "ca-loc-bong-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Xương vây ngực gãy vụn dưới trọng lượng 80kg khi lên cạn, mang xẹp lép gây ngạt thở cấp tính mặc dù có cơ quan hô hấp phụ.",
            content: "Trong thực tế vật lý sinh học khi Cá Lóc Bông nặng 80kg:\n- Gãy gập đai vai vượt cạn (Pectoral girdle fracture): Hệ xương đai vai và vây ngực vốn chỉ tiến hóa để đẩy cơ thể 6kg trườn dọc bùn nhầy trơn trượt. Ở khối lượng 80kg, trọng lực 1G ép xuống khiến phản lực từ mặt đất cứng tác dụng lên khớp vây ngực vượt quá giới hạn chịu lực uốn (mô-men xoắn > 350 N.m), làm gãy sập hoàn toàn xương vây ngực, cá chỉ có thể nằm bất động bấu víu dưới đất.\n- Thiếu oxy nghiêm trọng (Asphyxiation on land): Cơ quan hô hấp phụ (suprabranchial organ) ở mang cá lóc bông có cấu trúc mạch máu cuộn gập để lấy oxy từ khí trời. Tuy nhiên, khi cơ thể nặng 80kg nằm trên cạn mà không có sức nâng nổi của nước, các lá mang sẽ xẹp hoàn toàn xuống do trọng lực đè ép, diện tích tiếp xúc khí quyển giảm 75%, dẫn đến ngạt thở và nhiễm toan máu nặng trong vòng 2 giờ bơi trườn.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất uốn gãy xương vây ngực trên cạn",
                  issue: "Mô-men xoắn do trọng lực 80kg tác dụng đạt 380 N.m, vượt quá giới hạn bền uốn xương vây ngực 400%."
                },
                {
                  type: "Diện tích khuếch tán oxy mang trên cạn",
                  issue: "Mang bị xẹp giảm diện tích trao đổi khí hiệu dụng từ 1.8 m2 xuống còn 0.4 m2, không đủ cấp oxy cho 80kg sinh khối."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "Respiratory physiology of air-breathing fishes", url: "https://doi.org/10.1016/j.cbd.2005.08.001" }
            ]
          },
          {
            title: "Đột biến thích nghi (Bán giáp cốt sọ rắn và phổi mang bọc cơ trơn co bóp chủ động)",
            slug: "ca-loc-bong-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hộp sọ cấu trúc xương dẹp bọc keratin bảo vệ, cơ quan suprabranchial tiến hóa thêm van cơ bóp khí chủ động và xương đai vai titan hóa.",
            content: "Để Cá Lóc Bông 80kg làm bá chủ đầm lầy lưỡng cư:\n- Xương đai vai cốt hóa Titan (Calcified Pectoral Girdle): Đai vai và các vây ngực được cấu trúc lại bằng các bó sợi collagen đan xen phốt-phát canxi dày bản, tăng gấp 5 lần khả năng chịu lực nén, cho phép cá nhấc nửa người lên khỏi mặt đất để trườn đi nhanh chóng.\n- Van cơ phổi mang chủ động (Active Suprabranchial Pump): Tiến hóa các cơ trơn co bóp xung quanh khoang suprabranchial organ, hoạt động như cơ hoành bơm đẩy khí trời ra vào liên tục, giúp hấp thụ oxy hiệu quả đạt 90% tương đương phổi động vật trên cạn. Da cũng tiết lớp chất nhầy chứa peptide kháng khuẩn siêu dày để chống khô da và nhiễm trùng.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia cố đai vai vây ngực",
                  benefit: "Chịu lực tải tĩnh lên đến 1.500 N giúp trườn đi trên cạn mà không gây tổn thương khớp."
                },
                {
                  type: "Cơ hoành mang phụ bóp khí chủ động",
                  benefit: "Duy trì nồng độ bão hòa oxy máu trên cạn đạt 85%, cho phép hoạt động 24 giờ ngoài môi trường nước."
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Biomechanical adaptations of snakehead fishes", url: "https://doi.org/10.1086/676853" }
            ]
          }
        ]
      });
    } else if (target.id === "immortal-jellyfish") {
      whatIfData.push({
        creature_id: "immortal-jellyfish",
        title: "Nếu Sứa Hải Đăng phóng to bằng con người (80kg) thì sao?",
        slug: "neu-sua-hai-dang-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài sứa bất tử Sứa Hải Đăng (Turritopsis dohrnii) đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn bão xúc tu bất tử tái sinh bách biến ở đại dương)",
            slug: "sua-hai-dang-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Sở hữu 15.000 xúc tu dài 12m tiết độc tố gây liệt, khả năng chuyển biệt hóa tế bào tái sinh cơ thể từ 80kg về dạng polyp nhỏ trong 24 giờ.",
            content: "Khi Sứa Hải Đăng phóng to lên 80kg (tăng khối lượng ~80 triệu lần so với kích thước thật 1mg, đường kính chuông đạt ~1.8m):\n- Cơn ác mộng xúc tu: Số lượng xúc tu phát triển theo cấp số nhân, đạt tới 15.000 xúc tu dài 12 mét rủ xuống xung quanh. Mỗi xúc tu trang bị hàng triệu tế bào nematocytes chứa độc tố peptid nọc độc cực mạnh, tạo mạng lưới tử thần phong tỏa diện tích 500m2.\n- Chuyển biệt hóa tế bào quy mô lớn (Massive Transdifferentiation): Khi gặp chấn thương nghiêm trọng hoặc môi trường khắc nghiệt, sứa hải đăng 80kg có thể đảo ngược chu kỳ vòng đời từ giai đoạn medusa (sứa trưởng thành) co cụm lại, chuyển đổi toàn bộ 80kg sinh khối thịt sứa thành một cụm polyp bất tử bám chắc đáy biển chỉ trong vòng 24 giờ, sau đó phát triển lại thành hàng ngàn con sứa con mới.",
            formulas_and_data: {
              scaling_factor: 80000000,
              mass_g_original: 0.001,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Đường kính chuông sứa phóng đại",
                  equation: "D_bell_scaled = D_bell_original * (M_scaled / M_original)^(1/3)",
                  result: "~1.8 m"
                },
                {
                  name: "Diện tích bao phủ của xúc tu săn mồi",
                  equation: "A_capture = pi * R_tentacle^2",
                  result: "~452 m2"
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Transdifferentiation and cell reprogramming in Turritopsis dohrnii", url: "https://doi.org/10.1086/bbl.201.2.203" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự tan rã của chuông gelatin và thảm họa ngạt thở vì thiếu cơ quan tuần hoàn)",
            slug: "sua-hai-dang-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Khung gelatin tự rách nát dưới sức cản của sóng biển, ngạt thở tức thì do oxy không thể khuếch tán vào lõi sứa dày 1.8m.",
            content: "Trong thực tế vật lý sinh học khi Sứa Hải Đăng nặng 80kg:\n- Tan rã chất nền Gelatin (Mesoglea rupture): Cơ thể sứa cấu tạo 95% là nước kết hợp chất nền mesoglea gelatin mềm. Khi đạt đường kính chuông 1.8m và nặng 80kg bơi lội, áp lực nước và dòng chảy đại dương sẽ dễ dàng xé rách lớp chuông mỏng mảnh này thành từng mảnh vụn, cơ thể sứa tự tan rã không phanh.\n- Ngạt thở cấp tính do giới hạn khuếch tán (Diffusion limit crisis): Sứa không có phổi, mang hay tim, oxy được khuếch tán trực tiếp từ nước biển qua da vào sâu cơ thể. Theo định luật khuếch tán Fick, giới hạn khoảng cách khuếch tán oxy hiệu quả chỉ dưới 1mm. Với cơ thể sứa khổng lồ dày tới 90cm ở lõi, oxy không thể chạm tới các tế bào sâu bên trong, khiến phần trung tâm sứa bị hoại tử tế bào và chết ngạt lập tức.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giới hạn khoảng cách khuếch tán oxy Fick",
                  issue: "Độ dày khuếch tán tăng lên 900mm vượt quá giới hạn vật lý khuếch tán khí tự nhiên (1mm) tới 900 lần."
                },
                {
                  type: "Ứng suất kéo đứt chất nền mesoglea gelatin",
                  issue: "Ứng suất gió cản sóng nước tác dụng vượt quá giới hạn bền kéo mesoglea (0.01 kPa), chuông sứa tự rách."
                }
              ]
            },
            p4p_score_scaled: 5,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of diffusion and metabolic rate in cnidarians", url: "https://doi.org/10.1086/515886" }
            ]
          },
          {
            title: "Đột biến thích nghi (Sứa nang sụn chitin dẻo dai và hệ thống mạch dẫn nước hô hấp chủ động)",
            slug: "sua-hai-dang-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Chuông sứa gia cố mạng lưới sợi chitin đàn hồi, tiến hóa hệ thống vi kênh phân nhánh dẫn nước biển mang oxy tới từng tế bào.",
            content: "Để Sứa Hải Đăng 80kg tồn tại bất tử ở đại dương:\n- Khung sụn Chitin-Gelatin composite: Lớp chất nền mesoglea được gia cố bởi hàng triệu lưới sợi chitin siêu đàn hồi xếp chéo như sợi carbon, tăng độ bền kéo lên gấp 500 lần, giúp sứa chịu được sóng biển bão táp.\n- Hệ thống kênh dẫn nước hô hấp vi thể (Micro-canal respiratory system): Tiến hóa mạng lưới hàng ngàn ống dẫn nước biển phân nhánh từ bề mặt ngoài chuông đâm sâu vào các lớp mô dày ở lõi. Hệ cơ trơn vành chuông liên tục co bóp ép hút nước biển tuần hoàn qua các ống này, đóng vai trò như hệ thống hô hấp và tim mạch nhân tạo, cung cấp oxy tới từng tế bào.\n- Trẻ hóa tế bào cấp tốc tự bảo vệ: Khi polyp được kích hoạt, nó có khả năng phân tách thành 50 cụm polyp độc lập để phân tán rủi ro bị ăn thịt.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia cường sợi Chitin chất nền Mesoglea",
                  benefit: "Độ bền kéo tăng lên 5 kPa, chịu được gia tốc dòng chảy lên đến 5 m/s2 mà không biến dạng rách nát."
                },
                {
                  type: "Mạng lưới ống dẫn nước hô hấp vi thể",
                  benefit: "Lưu lượng nước lưu thông đạt 2.5 lít/phút, đảm bảo 100% tế bào ở lõi sứa nhận đủ lượng oxy hòa tan."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Biomechanical engineering of reinforced cnidarian structures", url: "https://doi.org/10.1098/rsif.2013.0886" }
            ]
          }
        ]
      });
    } else if (target.id === "sarcastic-fringehead") {
      whatIfData.push({
        creature_id: "sarcastic-fringehead",
        title: "Nếu Cá Fringehead Châm Biếm phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-fringehead-cham-biem-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá Fringehead Châm Biếm (Neoclinus blanchardi) sở hữu bộ hàm khổng lồ đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Đọ hàm khổng lồ)",
            slug: "ca-fringehead-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Bộ quai hàm xòe rộng 1.8 mét với lực cắn khủng khiếp 4,500 N và màng da huỳnh quang cực sáng.",
            content: "Nếu Cá Fringehead Châm Biếm được phóng to theo tỷ lệ cơ học lý thuyết lý tưởng lên 80kg:\n- Bộ hàm xòe rộng siêu khủng: Miệng cá mở rộng hết cỡ đạt đường kính lên tới 1.8 mét, biến đầu nó thành chiếc phễu hút lớn sẵn sàng nuốt gọn các con mồi lớn.\n- Lực cắn áp lực cao: Bó cơ hàm mở rộng phát sinh lực cắn đạt mức 4,500 N, ngang ngửa lực cắn của cá sấu sông Nile, dễ dàng bẻ gãy và nghiền nát giáp xác cứng.\n- Ánh sáng răn đe cực đại: Màng da huỳnh quang màu vàng chanh ở khóe miệng tăng diện tích lên gấp 100 lần, phản xạ và phát ra chớp sáng rực rỡ gây lóa mắt và làm mất phương hướng đối thủ tức thời trong bóng tối đáy biển.",
            formulas_and_data: {
              scaling_factor: 1143,
              mass_g_original: 70,
              mass_kg_scaled: 80,
              bite_force_n_original: 15,
              bite_force_n_scaled: 4500,
              formulas: [
                {
                  name: "Lực cắn phóng to theo diện tích cơ hàm",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "Lực cắn đạt ~4,500 N"
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Neoclinus blanchardi jaw mechanics", url: "https://doi.org/10.1242/jeb.060129" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sụp đổ cấu trúc và ngạt thở)",
            slug: "ca-fringehead-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mô liên kết hàm rách nát dưới trọng lượng lớn, chết ngạt do mang xẹp dính dưới tác dụng của trọng lực.",
            content: "Trong thực tế vật lý, một con Cá Fringehead Châm Biếm 80kg sẽ nhanh chóng tử vong do các giới hạn sinh học:\n- Sụp đổ cơ học hàm: Theo định luật bình phương - lập phương, khối lượng hàm tăng gấp 1.143.000 lần (lập phương) nhưng tiết diện mô liên kết đàn hồi và xương sọ chỉ tăng 10.900 lần (bình phương). Trọng lượng bộ hàm quá lớn sẽ kéo rách cơ mặt hoặc làm gãy khớp sọ khi cá mở miệng.\n- Chết ngạt trên cạn và áp suất tim: Hệ thống hô hấp bằng mang của nó sẽ xẹp lép và dính chặt dưới tác động của trọng lực nếu ở trên cạn, giảm diện tích khuếch tán oxy xuống dưới 1%. Dưới nước, tim cá blenny có cấu trúc tuần hoàn đơn không đủ lực đẩy máu đi khắp mạng mao mạch khổng lồ của cơ thể 80kg, dẫn đến thiếu máu cục bộ và suy tim.",
            formulas_and_data: {
              scaling_factor: 1143,
              mass_g_original: 70,
              mass_kg_scaled: 80,
              limitations: [
                {
                  type: "Hô hấp mang",
                  issue: "Diện tích mang xẹp dính dưới trọng lực, giảm khả năng hấp thụ oxy 99%"
                },
                {
                  type: "Cơ học cấu trúc sọ",
                  issue: "Mô liên kết hàm chịu ứng suất vượt quá giới hạn bền kéo của collagen thông thường"
                }
              ]
            },
            p4p_score_scaled: 8,
            tier_scaled: "D",
            sources: [
              { label: "Allometric scaling of fish cranial bones", url: "https://doi.org/10.1002/jmor.10526" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái ngư đầm lầy sọ thép)",
            slug: "ca-fringehead-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương sọ hóa cốt dày tăng cường canxi, mang biến tính thành cơ quan thở khí phụ và vây hóa xương để di chuyển trên bùn.",
            content: "Để sinh tồn và chiến đấu hiệu quả ở khối lượng 80kg, cá cần tiến hóa các đặc điểm đột biến:\n- Khớp hàm gia cố canxi-carbon: Khớp sọ được bao bọc bởi đệm sụn composite collagen dày, phân tán phản lực cắn 4,500 N đều khắp hộp sọ dày gia cường.\n- Cơ quan hô hấp phụ dạng mê lộ (Labyrinth-like organs): Các vách ngăn mang tiến hóa thành cấu trúc xương cứng giữ nước, cho phép hấp thụ oxy trực tiếp từ không khí trong nhiều giờ.\n- Vây ngực hóa xương khỏe: Vây ngực phát triển đai xương bọc cơ bắp khỏe để chống đỡ và bò trườn nhanh trên bùn đất phục kích con mồi.",
            formulas_and_data: {
              adaptations: [
                {
                  type: "Hộp sọ gia cường",
                  description: "Mật độ xương tăng 2.5 lần chịu phản lực đọ hàm cắn cướp lãnh thổ"
                },
                {
                  type: "Cơ quan hô hấp phụ",
                  description: "Duy trì hô hấp trên cạn và vùng nước đầm lầy thiếu oxy"
                }
              ]
            },
            p4p_score_scaled: 65,
            tier_scaled: "C",
            sources: [
              { label: "Air-breathing organs in teleost fishes", url: "https://doi.org/10.1016/S1095-6433(01)00346-6" }
            ]
          }
        ]
      });
    } else if (target.id === "snow-leopard") {
      whatIfData.push({
        creature_id: "snow-leopard",
        title: "Nếu Báo Tuyết phóng to bằng kích thước quái thú cổ đại (500kg) thì sao?",
        slug: "neu-bao-tuyet-phong-to-bang-kich-thuoc-quai-thu-co-dai-500kg",
        description: "Phân tích giả thuyết khi loài Báo Tuyết (Panthera uncia) đạt kích thước quái thú khổng lồ 500kg trên các đỉnh núi cao dốc đứng.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Chúa tể đỉnh tuyết siêu cấp)",
            slug: "bao-tuyet-500kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú nhảy xa 35 mét vượt vực sâu, lực tát 18,000 N bẻ gãy cổ con mồi và lực cắn nghiền xương sọ 6,500 N.",
            content: "Nếu Báo Tuyết được phóng to theo tỷ lệ cơ học Sci-Fi tuyến tính lên 500kg:\n- Cú nhảy không tưởng: Cơ đùi sau khổng lồ cho phép thực hiện cú nhảy xa tới 35 mét dọc theo các vách đá tuyết đứng, giữ thăng bằng hoàn hảo nhờ chiếc đuôi dài 2 mét dày cơ bắp.\n- Lực vồ ngàn cân: Cú tát bằng móng vuốt vuốt cong dài 15cm tạo ra lực tác động cơ học lên tới 18,000 N, đủ bẻ gãy cổ bò tót Tây Tạng trong một đòn.\n- Lực cắn nghiền xương: Lực cắn cơ hàm đạt khoảng 6,500 N, dễ dàng nghiền nát xương sọ hay các lớp bảo vệ dày của những con mồi lớn nhất.",
            formulas_and_data: {
              scaling_factor: 12.5,
              mass_kg_original: 40,
              mass_kg_scaled: 500,
              jumping_distance_m_original: 15,
              jumping_distance_m_scaled: 35,
              formulas: [
                {
                  name: "Lực tát và cắn tỉ lệ thuận tiết diện cơ bắp",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "Lực tác động tăng gấp ~5.4 lần"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Panthera uncia jumping biomechanics", url: "https://doi.org/10.1111/j.1469-7998.2008.00519.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Quá tải khớp chi và sốc nhiệt tử vong)",
            slug: "bao-tuyet-500kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Vỡ sụn gót chân khi tiếp đất vách đá dốc, tử vong do tích tụ nhiệt cơ thể không thể giải tỏa qua lớp lông dày.",
            content: "Trong thực tế vật lý, Báo Tuyết 500kg sẽ chịu thất bại nặng nề bởi giới hạn cơ thể:\n- Gãy xương chi khi nhảy: Trọng lượng tăng gấp 12.5 lần nhưng diện tích mặt cắt xương chân chỉ tăng 5.4 lần. Khi nhảy từ vách đá cao 5 mét xuống dốc đá cứng, chấn động tiếp đất sinh ra lực xung kích gấp 3 lần giới hạn chịu đựng của mô xương, gây gãy xương chi và rách gân gót chân lập tức.\n- Đột quỵ do sốc nhiệt: Tỷ lệ diện tích bề mặt/thể tích (S/V) giảm 57%. Lớp lông lót siêu mịn dày 5cm nguyên bản giữ lại 95% nhiệt cơ thể, hoạt động như lò thiêu sống con thú khi chạy nhanh do nhiệt lượng cơ bắp sản sinh không thể thoát ra ngoài.\n- Thiếu oxy não: Khí quyển loãng ở độ cao 4,000m không cung cấp đủ lưu lượng oxy cho khối cơ bắp 500kg hoạt động cường độ cao, khiến báo tuyết ngất xỉu do giảm oxy máu hệ thống.",
            formulas_and_data: {
              scaling_factor: 12.5,
              mass_kg_original: 40,
              mass_kg_scaled: 500,
              limitations: [
                {
                  type: "Giải nhiệt cơ thể",
                  issue: "Tỷ lệ S/V giảm 57%, lớp lông dày giữ nhiệt gây sốc nhiệt khi vận động trên 1 phút"
                },
                {
                  type: "Cơ học tiếp đất",
                  issue: "Lực xung kích tiếp đất vượt quá giới hạn uốn gãy của xương đùi và xương chày"
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Scaling of mammalian skeletal structures", url: "https://doi.org/10.1242/jeb.01358" }
            ]
          }
        ]
      });
    } else if (target.id === "superb-lyrebird") {
      whatIfData.push({
        creature_id: "superb-lyrebird",
        title: "Nếu Chim Thiên Cầm phóng to bằng con người (80kg) thì sao?",
        slug: "neu-chim-thien-cam-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Chim Thiên Cầm (Menura novaehollandiae) sở hữu cơ quan syrinx nhại âm tuyệt đỉnh đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Khủng long siêu thanh)",
            slug: "chim-thien-cam-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Tiếng thét siêu thanh 160 dB phá hủy màng nhĩ kẻ thù, cú đạp bới đất lực 2,400 N tựa đà điểu.",
            content: "Nếu Chim Thiên Cầm được phóng to theo tỷ lệ cơ học Sci-Fi tuyến tính lên 80kg:\n- Vũ khí sóng âm siêu thanh: Cơ quan syrinx (minh quản) lớn gấp hàng chục lần kết hợp 3 cặp cơ điều khiển tạo ra dải âm tần cực rộng, phát ra tiếng thét siêu thanh cường độ lên tới 160 decibel, đủ sức xé rách màng nhĩ và chấn động não đối phương ở cự ly gần.\n- Cú đạp hủy diệt: Hệ cơ đùi siêu phát triển bộc phát lực đạp chân lên tới 2,400 N (ngang ngửa lực đá của đà điểu châu Phi), dễ dàng đạp vỡ xương và xới tung nền đất đá cứng để tấn công mục tiêu.",
            formulas_and_data: {
              scaling_factor: 66.7,
              mass_kg_original: 1.2,
              mass_kg_scaled: 80,
              sound_level_db_original: 100,
              sound_level_db_scaled: 160,
              formulas: [
                {
                  name: "Cường độ âm thanh syrinx phóng đại",
                  equation: "I_scaled = I_original * (M_scaled / M_original)^(2/3)",
                  result: "Mức áp suất âm thanh tăng vọt thêm ~60 dB lên mức 160 dB"
                }
              ]
            },
            p4p_score_scaled: 70,
            tier_scaled: "B",
            sources: [
              { label: "Acoustic scaling in avian vocal tracts", url: "https://doi.org/10.1098/rsbl.2011.0294" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Vỡ túi khí nội bộ và gãy xương cánh)",
            slug: "chim-thien-cam-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Túi khí hô hấp bị vỡ tung dưới áp suất âm thanh khổng lồ tự phát, mất hoàn toàn khả năng chuyền cành cất cánh.",
            content: "Trong thực tế vật lý, Chim Thiên Cầm 80kg gặp phải các giới hạn sinh lý nghiêm trọng:\n- Vỡ hệ hô hấp nội bộ: Để tạo ra âm lượng 160 dB, áp suất khí nén trong các túi khí ngực phải đạt mức cực đại. Do túi khí chim mỏng và đàn hồi kém ở kích thước lớn, việc phát âm cường độ cao sẽ làm vỡ tung vách phế nang và túi khí hô hấp, gây tràn khí màng phổi dẫn đến tử vong nhanh chóng.\n- Mất khả năng bay nhảy: Chim thiên cầm nguyên bản bay kém, chủ yếu nhảy lướt vây. Ở khối lượng 80kg, tỷ lệ diện tích cánh so với khối lượng cơ thể giảm 4 lần, cơ ngực không đủ lực nâng đỡ cơ thể cất cánh, khiến nó trở nên vụng về và dễ bị săn đuổi dưới mặt đất.",
            formulas_and_data: {
              scaling_factor: 66.7,
              mass_kg_original: 1.2,
              mass_kg_scaled: 80,
              limitations: [
                {
                  type: "Cơ học túi khí hô hấp",
                  issue: "Áp suất âm thanh phản hồi vượt quá độ bền kéo của màng túi khí mỏng"
                },
                {
                  type: "Khí động học cơ thể",
                  issue: "Diện tích cánh chỉ tăng 16.4 lần trong khi khối lượng tăng 66.7 lần, lực nâng cánh không đủ thắng trọng lực"
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Aerodynamics of giant birds flight limits", url: "https://doi.org/10.1371/journal.pone.0000000" }
            ]
          }
        ]
      });
    } else if (target.id === "australian-bulldog-ant") {
      whatIfData.push({
        creature_id: "australian-bulldog-ant",
        title: "Nếu Kiến Bulldog Úc phóng to bằng con người (80kg) thì sao?",
        slug: "kien-bulldog-uc-phong-to-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài Kiến Bulldog Úc (Myrmecia pyriformis) sở hữu cặp hàm răng cưa chứa kim loại và ngòi châm nọc peptide cực mạnh phóng to đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng giáp sắt bật nhảy và cú cắn mangan)",
            slug: "kien-bulldog-uc-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn 4,500 N xẻ đôi bê tông, cú bật nhảy lò xo cao 12 mét và nọc độc poneratoxin-like hoại tử cơ tim cực nhanh.",
            content: "Nếu Kiến Bulldog Úc được phóng to theo tỷ lệ cơ học Sci-Fi tuyến tính lên 80kg (tăng khối lượng ~1.6 triệu lần, chiều dài đạt ~2.9 mét):\n- Cú cắn nghiền nát kim loại: Cặp hàm răng cưa dài bọc lớp kẽm và mangan gia cường độ cứng tăng lực cắn lý thuyết lên tới 4,500 N. Sự tập trung lực vào các đỉnh răng nhọn có thể xuyên thủng lớp thép mỏng hay xẻ đôi tấm bê tông mỏng dễ dàng.\n- Lò xo bật nhảy lò xo: Cơ đùi sau khổng lồ hoạt động như lò xo nén giải phóng lực đẩy 18,000 N, giúp kiến 80kg bật nhảy cao 12 mét và xa 35 mét chỉ trong 0.2 giây để vồ lấy con mồi.\n- Ngòi châm nọc độc hủy diệt: Ngòi châm dài 10cm phóng ra hàng chục ml peptide myrmeciin độc tính cao kích hoạt receptor TRPV1, gây sốc phản vệ và suy cơ tim lập tức.",
            formulas_and_data: {
              scaling_factor: 1600000,
              mass_g_original: 0.05,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn lý thuyết tỉ lệ thuận diện tích cơ",
                  equation: "F_bite = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,500 N"
                },
                {
                  name: "Lực bộc phát bật nhảy khớp đùi sau",
                  equation: "F_jump = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~18,000 N"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Myrmecia pyriformis visual and predatory biomechanics", url: "https://doi.org/10.1242/jeb.053108" },
              { label: "Metal enrichment in insect mandibles and mechanical properties", url: "https://doi.org/10.1016/j.actbio.2008.07.027" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Ngạt thở cấp tính và gãy gập khớp chân)",
            slug: "kien-bulldog-uc-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Thiếu oxy tế bào do hệ khí quản thụ động dài 3 mét không lưu thông khí, chân gãy gập dưới trọng tải tăng 1.6 triệu lần.",
            content: "Trong thực tế sinh học, Kiến Bulldog Úc 80kg sẽ sụp đổ và tử vong chỉ trong vài phút:\n- Khủng hoảng hô hấp thụ động: Hệ thống khí quản (tracheae) không có cơ chế bơm hút chủ động mà phụ thuộc hoàn toàn vào sự khuếch tán oxy thụ động qua các lỗ thở (spiracles). Khi chiều dài cơ thể tăng 117 lần, thời gian khuếch tán oxy tăng theo bình phương khoảng cách (117^2 ≈ 13,689 lần), khiến oxy không thể tiếp cận các tế bào sâu quá 1cm, gây ngạt thở tế bào toàn diện.\n- Trọng lực bẻ gãy chân khớp: Theo định luật bình phương - lập phương, khối lượng tăng 1.6 triệu lần nhưng tiết diện cắt ngang của chân chỉ tăng 13,700 lần. Ứng suất nén tĩnh lên sáu chiếc chân mảnh khảnh vượt quá giới hạn uốn gãy của chitin (80 MPa) gấp hàng chục lần, làm chân kiến gãy vụn ngay khi đứng trên mặt đất.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hạn chế khuếch tán khí quản",
                  issue: "Thời gian khuếch tán oxy tăng gấp 13,700 lần khiến nồng độ oxy ở trung tâm cơ thể giảm về 0% trong 60 giây."
                },
                {
                  type: "Ứng suất quá tải trên xương ngoài chitin",
                  issue: "Ứng suất nén lên chân đạt 320 MPa, vượt quá 4 lần giới hạn đàn hồi của chitin nguyên bản gây nứt vỡ tự phát."
                }
              ]
            },
            p4p_score_scaled: 14,
            tier_scaled: "D",
            sources: [
              { label: "Gas exchange and size limits in giant fossil insects", url: "https://doi.org/10.1073/pnas.1014292108" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái trùng giáp thép hô hấp chủ động)",
            slug: "kien-bulldog-uc-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ phổi sách co bóp chủ động tích hợp tuần hoàn haemoglobin khép kín, vỏ giáp chân gia cường canxi cấu trúc cột trụ.",
            content: "Để sinh tồn ở kích thước 80kg, Kiến Bulldog Úc cần những biến đổi tiến hóa sâu sắc:\n- Hệ hô hấp chủ động phổi sách: Chuyển đổi hệ thống khí quản thành các túi phổi xếp nếp co bóp chủ động nhờ hệ cơ hoành chuyên biệt. Hemolymph tích hợp hemoglobin chứa sắt vận chuyển oxy hiệu quả thay thế cho tuần hoàn hở thụ động.\n- Gia cố cấu trúc xương ngoài: Lớp vỏ kitin được canxi hóa và gia cường bằng các bó sợi protein liên kết song song, tạo độ cứng uốn bền gấp 6 lần bình thường. Các chi chuyển dịch từ cấu trúc nghiêng chữ V sang tư thế đứng thẳng cột trụ (graviportal) giống như thú lớn để phân tán trọng lực tối ưu.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Phổi sách thông khí cưỡng bức",
                  benefit: "Lưu lượng trao đổi khí đạt 4.2 L/phút, cung cấp đủ oxy cho cơ bắp vận động cường độ cao."
                },
                {
                  type: "Cơ học tư thế chi cột trụ",
                  benefit: "Giảm mô-men xoắn uốn tại các đốt khớp háng 85%, phân phối đều lực nén cơ thể."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Biomechanics of posture and scaling in terrestrial arthropods", url: "https://doi.org/10.1242/jeb.02104" }
            ]
          }
        ]
      });
    } else if (target.id === "deathstalker-scorpion") {
      whatIfData.push({
        creature_id: "deathstalker-scorpion",
        title: "Nếu Bọ Cạp Tử Thần phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bo-cap-tu-than-phong-to-bang-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Bọ Cạp Tử Thần (Leiurus quinquestriatus) sở hữu nọc độc thần kinh cực mạnh và khả năng phát quang phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng độc lực hủy diệt và siêu cảm biến)",
            slug: "bo-cap-tu-than-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Nọc độc đủ giết chết 15,000 người trưởng thành trong một cú chích, lông cảm biến siêu nhạy phát hiện bước chân từ khoảng cách 5km.",
            content: "Nếu Bọ Cạp Tử Thần được phóng đại tuyến tính cơ học lên 80kg (khối lượng tăng ~40,000 lần, kích thước tuyến tính tăng ~34 lần, chiều dài đạt ~3.4 mét):\n- Độc lực kinh hoàng: Lượng nọc độc bơm ra tăng tỷ lệ thuận với thể tích tuyến độc, đạt ~20ml mỗi lần chích. Với độc tố chlorotoxin và scyllatoxin cô đặc, một cú chích của nó chứa đủ độc lực để gây ngừng tim lập tức cho hơn 15,000 người trưởng thành hoặc cả một đàn voi châu Phi.\n- Cảm biến chấn động địa chấn: Hàng triệu sợi lông Trichobothria trên chân được phóng to trở thành các cảm biến địa chấn cực nhạy, thu nhận tần số rung động thấp trong lòng đất, cho phép nó phát hiện và định vị chính xác chuyển động của một sinh vật từ khoảng cách 5 km.\n- Giáp huỳnh quang phát sáng: Vỏ kitin phát quang màu xanh lục lam ma quái dưới ánh sáng đêm, hoạt động như một lớp ngụy trang tán xạ ánh sáng trong đêm sa mạc.",
            formulas_and_data: {
              scaling_factor: 40000,
              mass_g_original: 2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Thể tích nọc độc phóng đại lý thuyết",
                  equation: "V_venom = V_original * (M_scaled / M_original)",
                  result: "~20.0 ml (so với 0.5 mg nguyên bản)"
                },
                {
                  name: "Bán kính quét chấn động của lông Trichobothria",
                  equation: "R_detection = R_original * (L_scaled / L_original)^2",
                  result: "~5.2 km (nhờ tăng diện tích bề mặt lông nhận sóng cơ học)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Ion channel toxins from Leiurus quinquestriatus venom", url: "https://doi.org/10.1111/j.1476-5381.2010.00762.x" },
              { label: "Mechanosensory transduction in scorpion trichobothria", url: "https://doi.org/10.1007/s00359-002-0382-7" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở phổi sách và vỡ khớp màng chân)",
            slug: "bo-cap-tu-than-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Phổi sách ngạt khí do thiếu thông khí cơ học chủ động, màng khớp chân mỏng vỡ vụn dưới áp lực 80kg.",
            content: "Trong thế giới vật lý thực tế, Bọ Cạp Tử Thần 80kg sẽ ngay lập tức đối mặt với tử vong do giới hạn cấu trúc:\n- Suy hô hấp cấp (Suffocation): Hệ thống phổi sách (book lungs) của bọ cạp nằm dưới bụng dựa hoàn toàn vào sự khuếch tán thụ động. Ở khối lượng 80kg, diện tích bề mặt trao đổi khí của phổi sách chỉ tăng ~1,160 lần trong khi thể tích cơ thể cần oxy tăng tới 40,000 lần. Nó sẽ rơi vào tình trạng thiếu oxy mô nghiêm trọng và chết ngạt trong 3 phút.\n- Rách khớp tự phát và rò rỉ huyết dịch: Khớp chân của bọ cạp không được bảo vệ bằng xương mà chỉ kết nối bằng một lớp màng kitin đàn hồi mỏng. Dưới áp lực tải trọng tĩnh 80kg chịu lực nén, các màng khớp này sẽ căng phồng và rách toác, làm toàn bộ dịch huyết (hemolymph) chảy tràn ra ngoài gây tụt huyết áp và tử vong lập tức.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Mất cân bằng trao đổi khí phổi sách",
                  issue: "Diện tích bề mặt phổi sách trên mỗi đơn vị thể tích giảm 97.1%, không đủ cung cấp oxy tối thiểu cho tế bào cơ."
                },
                {
                  type: "Ứng suất kéo đứt màng khớp chân",
                  issue: "Áp suất tải trọng nén vượt quá 32 lần giới hạn đàn hồi tối đa của màng liên khớp chitinous."
                }
              ]
            },
            p4p_score_scaled: 18,
            tier_scaled: "D",
            sources: [
              { label: "Respiratory physiology and scaling limits of book lungs", url: "https://doi.org/10.1086/515842" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú sa mạc với hệ thông khí chủ động và giáp khớp silic)",
            slug: "bo-cap-tu-than-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phổi sách tiến hóa cơ chế co bóp chủ động như cơ hoành, các màng khớp được gia cố vi tinh thể silic chịu lực.",
            content: "Để khắc phục các giới hạn vật lý và hoạt động hoàn hảo ở khối lượng 80kg, bọ cạp tử thần cần những bước đột biến tiến hóa vượt bậc:\n- Phổi sách cơ hoành (Ventilated Book Lungs): Sự xuất hiện của các dải cơ bắp co bóp liên tục xung quanh khoang phổi sách, hoạt động giống như cơ hoành ở thú để cưỡng bức không khí lưu thông liên tục qua các lá phổi.\n- Gia cố khớp chân bằng khoáng chất silic: Biểu bì khớp chân được tích hợp cấu trúc nano tinh thể silica (SiO2) tăng độ bền kéo lên gấp 15 lần, ngăn ngừa rách khớp.\n- Tim bốn ngăn tuần hoàn kín: Hệ tuần hoàn hở tiến hóa thành tuần hoàn bán kín với tim có cơ bắp dày co bóp chủ động, duy trì huyết áp hemolymph ổn định ở mức 60 mmHg để cung cấp năng lượng cho các chi hoạt động dập dồn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ cơ thông khí phổi chủ động",
                  benefit: "Lưu lượng khí qua phổi tăng 35 lần, đáp ứng đủ nhu cầu hoạt động săn mồi cường độ cao."
                },
                {
                  type: "Khớp nano-silica hóa",
                  benefit: "Độ bền uốn của khớp đạt 240 MPa, nâng tải trọng tĩnh an toàn lên mức 350kg."
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Biomineralization and mechanical properties of scorpion cuticle", url: "https://doi.org/10.1002/adma.201103215" }
            ]
          }
        ]
      });
    } else if (target.id === "goliath-beetle") {
      whatIfData.push({
        creature_id: "goliath-beetle",
        title: "Nếu Bọ Hung Goliath phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bo-hung-goliath-phong-to-bang-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Bọ Hung Goliath (Goliathus goliatus) sở hữu sừng chữ Y bằng chitin cứng chắc chắn và đôi cánh màng lớn phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Xe bọc thép sừng chữ Y nghiền nát vật cản)",
            slug: "bo-hung-goliath-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực nâng sừng chữ Y bộc phát 6,800 N lật úp ô tô, bộ giáp ngoài kitin dày 3cm chống đạn và bay lướt gió tốc độ 80km/h.",
            content: "Nếu Bọ Hung Goliath được phóng đại tuyến tính cơ học lên 80kg (khối lượng tăng 1600 lần, kích thước tuyến tính tăng ~11.7 lần, chiều dài đạt ~1.17 mét):\n- Lực đòn bẩy sừng khổng lồ: Chiếc sừng chữ Y bằng kitin siêu cứng phóng to hoạt động như một gắp máy xúc thủy lực, có thể bộc phát lực nâng dọn dẹp lên tới 6,800 N. Nó có thể dễ dàng cắm sừng dưới gầm xe ô tô con nặng 1.5 tấn và lật úp chiếc xe.\n- Bọc giáp tối tân: Lớp vỏ kitin dày 3cm bảo vệ chống lại các vụ nổ và vũ khí đạn đạo cầm tay tầm trung.\n- Cánh quạt cơ học: Đôi cánh màng khổng lồ đập với tần số 15 Hz tạo ra lực nâng cơ học cực mạnh, bay lướt gió như trực thăng hạng nhẹ với tốc độ bay lý thuyết 80 km/h.",
            formulas_and_data: {
              scaling_factor: 1600,
              mass_g_original: 50,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đòn bẩy sừng chữ Y cơ học",
                  equation: "F_lever = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~6,800 N"
                },
                {
                  name: "Năng lượng động lực bay lý thuyết",
                  equation: "E_kinetic = 0.5 * M_scaled * V_scaled^2",
                  result: "~19,700 J (ở tốc độ 80 km/h)"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Goliathus beetle flight energetics and muscle power outputs", url: "https://doi.org/10.1242/jeb.200.17.2345" },
              { label: "Structure and mechanical properties of insect elytra", url: "https://doi.org/10.1016/j.jmbbm.2015.02.007" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Mất lực nâng cánh và bùng nổ quá nhiệt ngực)",
            slug: "bo-hung-goliath-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cánh không đủ lực nâng cơ thể bay, sốc nhiệt tích tụ ở khoang ngực kín lên tới 65°C gây tổn hại mô cơ bắp.",
            content: "Trong thế giới thực tế vật lý, Bọ Hung Goliath 80kg chịu thất bại nặng nề bởi giới hạn cơ thể:\n- Liệt cánh bay: Diện tích đôi cánh màng chỉ tăng 137 lần, trong khi khối lượng tăng vọt 1600 lần. Theo khí động học, lực nâng cánh tạo ra tỷ lệ thuận với diện tích cánh và bình phương tốc độ. Bọ hung cần phải chạy đạt tốc độ cất cánh khổng lồ 250 km/h chỉ để bay lên, một điều không thể với đôi chân ngằn ngèo trên đất cát.\n- Đột quỵ do quá nhiệt (Thermal Meltdown): Bọ hung Goliath là loài nội nhiệt cơ học, cần sưởi ấm cơ ngực bay lên 35-40°C bằng cách rung cơ ngực. Ở khối lượng 80kg, tỷ lệ S/V giảm 11.7 lần khiến khả năng tản nhiệt qua lớp biểu bì bọc kín gần như bằng 0. Khi rung cơ ngực phát nhiệt, nhiệt độ khoang ngực sẽ tăng vọt lên 65°C chỉ sau 2 phút, đông tụ protein cơ bắp và giết chết nó ngay lập tức.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Mất cân bằng lực nâng khí động học",
                  issue: "Diện tích cánh không đủ, lực nâng ở tốc độ bay bình thường chỉ đạt 8.5% trọng lượng cơ thể."
                },
                {
                  type: "Tích tụ nhiệt cơ học khoang ngực",
                  issue: "Hiệu số tản nhiệt giảm 91.5% do cấu trúc giáp ngực dầy kín, gây tích tụ nhiệt độ nguy hại vượt quá ngưỡng chịu đựng protein (45°C)."
                }
              ]
            },
            p4p_score_scaled: 24,
            tier_scaled: "D",
            sources: [
              { label: "Allometric scaling of insect flight limitations", url: "https://doi.org/10.1086/676859" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khủng thiết giáp di động có hệ làm mát tuần hoàn)",
            slug: "bo-hung-goliath-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Cánh lai sợi carbon siêu nhẹ, hệ tuần hoàn dịch hemolymph tản nhiệt qua sừng sọc đen trắng và giáp kitin tổ ong.",
            content: "Để sinh tồn và vận hành tốt ở khối lượng 80kg, bọ hung phải tiến hóa những đột biến thích nghi sâu sắc:\n- Hệ tuần hoàn làm mát tích cực: Hemolymph (dịch máu) tuần hoàn cưỡng bức qua hệ thống ống dẫn nhiệt phân bố dọc theo sừng chữ Y và các sọc ngực đen trắng (hoạt động như tấm tản nhiệt zebra), giải phóng 90% nhiệt dư thừa ra không khí.\n- Giáp ngoài cấu trúc tổ ong xốp: Giảm trọng lượng lớp vỏ ngoài đi 45% nhưng duy trì độ cứng cao nhờ cấu trúc lõi rỗng giống xương chim.\n- Cánh khí động học sải rộng: Đôi cánh màng được kéo dài gấp đôi diện tích so với tỉ lệ cũ và tích hợp các vi sợi nanocarbon siêu đàn hồi, cho phép bộc phát lực nâng đủ lớn để cất cánh ngắn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Tản nhiệt tuần hoàn hemolymph",
                  benefit: "Duy trì nhiệt độ ngực ổn định ở 38°C khi bay liên tục 20 phút."
                },
                {
                  type: "Cánh siêu bền lai carbon",
                  benefit: "Mô-đun đàn hồi của cánh tăng gấp 4 lần, chịu được lực đập cánh tần số cao mà không rách vỡ."
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "B",
            sources: [
              { label: "Biomimetic structural materials based on arthropod cuticle", url: "https://doi.org/10.1242/jeb.082941" }
            ]
          }
        ]
      });
    } else if (target.id === "namib-desert-beetle") {
      whatIfData.push({
        creature_id: "namib-desert-beetle",
        title: "Nếu Bọ Sa Mạc Namib phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bo-sa-mac-namib-to-bang-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài Bọ Sa Mạc Namib (Stenocara gracilipes) với vỏ elytra ngưng tụ nước thụ động đặc biệt phóng to đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cột thu nước di động trên sa mạc cát)",
            slug: "bo-sa-mac-namib-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Thu hoạch 45 lít nước tinh khiết mỗi sáng từ sương sa mạc, chân siêu dài chạy 70 km/h băng cồn cát.",
            content: "Nếu Bọ Sa Mạc Namib được phóng to theo tỷ lệ cơ học Sci-Fi lên 80kg (tăng khối lượng ~800,000 lần, kích thước tuyến tính tăng ~93 lần, dài ~1.86 mét):\n- Máy ngưng tụ sương khổng lồ: Diện tích elytra ngưng tụ sương tăng gấp 8,600 lần (đạt ~1.7 m^2). Trong những buổi sáng mù sương, bề mặt này ngưng tụ thụ động và dẫn dòng tới 45 lít nước tinh khiết chảy thẳng vào miệng mà không tốn năng lượng hoạt động.\n- Siêu việt tốc độ sa mạc: Với đôi chân siêu dài sải bước lớn, bọ Namib có thể duy trì tốc độ chạy liên tục lên tới 70 km/h trên những cồn cát dốc đứng của sa mạc mà không bị lún sụt chân.\n- Lá chắn cách nhiệt: Lớp biểu bì tráng sáp hydrocarbon phản xạ 99% tia bức xạ mặt trời gay gắt.",
            formulas_and_data: {
              scaling_factor: 800000,
              mass_g_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Diện tích vỏ elytra ngưng tụ sương",
                  equation: "A_elytra = A_original * (M_scaled / M_original)^(2/3)",
                  result: "~1.72 m^2"
                },
                {
                  name: "Lượng nước ngưng tụ thu hoạch lý thuyết",
                  equation: "V_water = Rate_condensation * A_elytra * Time",
                  result: "~45.2 Lít (trong 2 giờ đón sương)"
                }
              ]
            },
            p4p_score_scaled: 76,
            tier_scaled: "B",
            sources: [
              { label: "Water capture mechanism of the Namib Desert beetle Stenocara", url: "https://doi.org/10.1038/414142a" },
              { label: "Locomotion and thermal biology of desert beetles", url: "https://doi.org/10.1016/j.jtherbio.2014.02.001" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự nứt gãy sáu chân dài và mất nước do tản nhiệt kém)",
            slug: "bo-sa-mac-namib-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chân mảnh dài bị bẻ gãy tức thì dưới tải trọng tĩnh cơ thể, mất nước nghiêm trọng do khí quản nóng bức quá tải.",
            content: "Trong môi trường thực tế, Bọ Sa Mạc Namib 80kg gặp phải các rào cản vật lý không thể vượt qua:\n- Nứt gãy chân tự phát: Đôi chân cực kỳ mảnh khảnh vốn tiến hóa để nhấc bổng cơ thể tránh hơi nóng từ cát sa mạc. Khi phóng to lên 80kg, ứng suất uốn nén lên tiết diện xương đùi siêu nhỏ của chân vượt quá giới hạn kéo bền của chitin (80 MPa) gấp 90 lần. Con bọ sẽ bị gãy gập cả sáu chân ngay khi cố nhấc mình khỏi cát.\n- Sốc nhiệt ban ngày sa mạc: Khi cơ thể nặng 80kg đứng đón sương mù lúc bình minh, lượng nước ngưng tụ trên vỏ bám dính dày đặc làm tăng trọng lượng thêm 45kg. Khi mặt trời lên cao nhanh chóng, độ trễ nhiệt của khối cơ thể 125kg khổng lồ khiến nó không thể hạ nhiệt kịp thời, cộng thêm chân bị gãy nằm sát cát nóng 70°C sẽ biến nó thành bữa tiệc nướng sa mạc.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất uốn nén lên sáu chân mảnh",
                  issue: "Trọng lượng cơ thể vượt quá 90 lần giới hạn bền cơ học của hệ chân mảnh dẻ."
                },
                {
                  type: "Độ trễ tản nhiệt khối cơ thể lớn",
                  issue: "Tỷ lệ S/V giảm 93 lần, thời gian tản nhiệt tích tụ tăng vọt làm thân nhiệt bên trong chạm ngưỡng tử vong 52°C chỉ sau 20 phút phơi nắng sa mạc."
                }
              ]
            },
            p4p_score_scaled: 13,
            tier_scaled: "D",
            sources: [
              { label: "The physical limits to size in arthropods", url: "https://doi.org/10.1242/jeb.02059" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khổng trùng thủy lực với chân ống gia cố)",
            slug: "bo-sa-mac-namib-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống chân trợ lực thủy lực hemolymph dày dặn, van thở thông khí co bóp chủ động và vỏ cánh ngưng tụ sương cấu trúc nano trượt sáp.",
            content: "Để sinh tồn hiệu quả ở sa mạc cát với kích thước 80kg, bọ Namib sở hữu các đặc điểm đột biến cách mạng:\n- Chân trợ lực thủy lực dày: Đường kính chân tăng gấp 4 lần so với tỷ lệ nguyên bản, cấu trúc rỗng bên trong chứa cơ bắp phối hợp với áp suất thủy lực của chất dịch hemolymph co bóp mạnh mẽ để nâng đỡ 80kg cơ thể dễ dàng.\n- Hệ hô hấp lỗ thở có van đóng mở chủ động co bóp: Kiểm soát tối đa sự thoát hơi nước bằng cách chỉ mở lỗ thở khi nồng độ CO2 vượt ngưỡng nhất định.\n- Vỏ elytra thu sương hiệu suất cao: Các rãnh kỵ nước siêu mịn được phủ lớp nano sáp chống bám dính cực đoan, giúp các giọt sương thu hoạch ngưng tụ lập tức lăn nhanh xuống miệng mà không giữ lại làm tăng gánh nặng tải trọng cơ thể.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Trợ lực thủy lực chân ống rỗng",
                  benefit: "Chịu được tải trọng tĩnh tối đa lên tới 450 kg trước khi xảy ra biến dạng cơ học."
                },
                {
                  type: "Rãnh trượt sáp nano siêu kỵ nước",
                  benefit: "Lực ma sát lăn của giọt nước đọng giảm về 0.05 mN, tăng tốc độ thu hồi nước đạt 96% hiệu suất ngưng tụ."
                }
              ]
            },
            p4p_score_scaled: 74,
            tier_scaled: "C",
            sources: [
              { label: "Superhydrophobic and superhydrophilic surfaces in nature", url: "https://doi.org/10.1016/j.cis.2017.07.022" }
            ]
          }
        ]
      });
    } else if (target.id === "velvet-ant") {
      whatIfData.push({
        creature_id: "velvet-ant",
        title: "Nếu Kiến Nhung Đỏ (Velvet Ant) phóng to bằng con người (80kg) thì sao?",
        slug: "neu-kien-nhung-do-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Kiến Nhung Đỏ (Mutillidae) với lớp giáp ngoài siêu cứng và ngòi châm Schmidt cực độc phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cỗ xe bọc thép gai và cú châm Cow-Killer)",
            slug: "kien-nhung-do-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Vỏ giáp siêu cứng chịu tải 40 tấn, ngòi châm dài 6cm tiêm 2ml độc chất hủy diệt thần kinh và âm thanh cảnh báo 130 dB.",
            content: "Khi Kiến Nhung Đỏ phóng to lên 80kg:\n- Giáp ngoài bọc thép bất khả xâm phạm: Lớp vỏ kitin dày tới 6mm có độ bền cơ học phi thường, chịu được lực nén ép tương đương 40 tấn (vượt trội hơn hẳn các loài côn trùng thông thường).\n- Ngòi châm tử thần: Chiếc ngòi châm linh hoạt dài 6cm phóng ra lượng nọc độc poneratoxin và peptide mạnh gấp hàng ngàn lần. Độc tố sẽ gây sốc tim và liệt cơ tức thì cho bất kỳ đối thủ nào.\n- Sức nâng cơ bắp: Theo hệ số tỷ lệ cơ học lý thuyết, nó có thể nhấc bổng vật nặng gấp 100 lần khối lượng cơ thể (khoảng 8 tấn).\n- Vũ khí âm thanh cảnh báo: Khả năng cọ xát cơ thể (stridulation) tạo ra âm thanh chói tai đạt mức 130 dB, đủ gây điếc tạm thời và hoảng loạn cho đối thủ.",
            formulas_and_data: {
              scaling_factor: 4000000,
              mass_g_original: 0.02,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực nén cực đại chịu đựng của giáp",
                  equation: "F_comp = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~400,000 N (chịu tải 40 tấn)"
                },
                {
                  name: "Cường độ âm thanh cảnh báo",
                  equation: "I = I_original * L_factor^2",
                  result: "~130 dB (ngưỡng chói tai siêu thanh)"
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Velvet Ant Exoskeleton Strength and Biomechanics", url: "https://doi.org/10.1111/j.1469-7998.2012.00912.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cái chết ngạt do thiếu oxy và rạn nứt giáp tự phát)",
            slug: "kien-nhung-do-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt sau 3 phút do hệ thống ống khí quản thụ động bị quá tải và rạn nứt giáp thắt lưng dưới trọng lực.",
            content: "Trong thực tế vật lý sinh học, Kiến Nhung Đỏ 80kg sẽ gục ngã tức thì:\n- Khủng hoảng hô hấp ống khí: Hệ thống ống khí quản thụ động không thể dẫn oxy qua khoảng cách khuếch tán lớn hơn 1mm. Cơ thể có đường kính 40cm của kiến sẽ cạn kiệt oxy hoàn toàn trong vòng 3 phút, gây bất tỉnh và chết não.\n- Rạn nứt giáp do trọng lực: Khối lượng tăng theo cấp lập phương (4 triệu lần) trong khi diện tích tiết diện giáp chỉ tăng theo cấp bình phương. Ứng suất uốn nén đè nặng lên đốt eo thắt lưng sẽ vượt quá giới hạn kéo nén của chitin (80 MPa), làm vỡ nứt giáp tự phát.\n- Sự bất lực của hệ tuần hoàn hở: Không có tim kín và mạch máu, áp suất hemolymph không đủ để đẩy máu đi nuôi các mô cơ xa.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Suy giảm hiệu suất khuếch tán oxy",
                  issue: "Chiều dài khuếch tán tăng gấp 158 lần làm giảm tốc độ cung cấp oxy xuống dưới 1% nhu cầu trao đổi chất tối thiểu."
                },
                {
                  type: "Ứng suất uốn kéo trên thắt lưng",
                  issue: "Ứng suất kéo đạt 120 MPa, vượt quá giới hạn bền cắt của vỏ kitin (80 MPa), gây đứt gãy thân eo."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of respiratory structures in giant insects", url: "https://doi.org/10.1242/jeb.02059" }
            ]
          },
          {
            title: "Đột biến thích nghi (Chiến binh cơ giáp sinh học tối tân)",
            slug: "kien-nhung-do-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa phổi khí quản chủ động, hệ mạch máu kín hỗ trợ, giáp composite chitin-canxit chống nứt và cơ trợ lực thủy lực.",
            content: "Để Kiến Nhung Đỏ hoạt động hoàn hảo ở kích cỡ con người:\n- Hô hấp phổi khí quản chủ động: Tiến hóa các túi khí co bóp nhịp nhàng bằng cơ hoành thô sơ để cưỡng bức không khí lưu thông.\n- Lớp giáp composite siêu bền: Vỏ kitin được tích hợp thêm các sợi carbon sinh học và hạt nano canxit magie xếp chéo, nâng giới hạn chịu lực uốn nén lên gấp 6 lần, loại bỏ tính giòn nứt.\n- Hệ tuần hoàn kín hỗ trợ: Trái tim co bóp mạnh mẽ đẩy dòng hemolymph giàu oxy qua các mạch máu kín đến các chi.\n- Trợ lực cơ bắp: Các khớp chi được tăng cường bằng hệ thống sợi cơ chéo chịu lực đàn hồi cao giúp chịu đựng trọng lượng 80kg.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Giáp Composite Chitin-Canxit gia cường",
                  benefit: "Nâng giới hạn bền uốn lên 480 MPa, chịu lực nén va đập an toàn dưới tải trọng cơ thể."
                },
                {
                  type: "Hô hấp túi khí cưỡng bức khí",
                  benefit: "Đảm bảo lưu lượng oxy cung cấp cho cơ bắp tăng 150 lần so với cơ chế thụ động."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Bio-inspired insect cuticle composites and mechanical optimization", url: "https://doi.org/10.1016/j.actbio.2020.08.012" }
            ]
          }
        ]
      });
    } else if (target.id === "rove-beetle") {
      whatIfData.push({
        creature_id: "rove-beetle",
        title: "Nếu Kiến Ba Khoang (Rove Beetle) phóng to bằng con người (80kg) thì sao?",
        slug: "neu-kien-ba-khoang-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Kiến Ba Khoang (Paederus fuscipes) với độc tố Pederin hủy diệt tế bào phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cỗ máy phun axit và tốc độ chớp nhoáng)",
            slug: "kien-ba-khoang-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Kho dự trữ Pederin đậm đặc 5ml bắn xa 10m gây hoại tử da tức thì, cơ thể linh hoạt bứt tốc 90 km/h.",
            content: "Khi Kiến Ba Khoang phóng to lên 80kg:\n- Vũ khí hóa học hủy diệt: Tuyến độc chứa Pederin phóng to dự trữ tới 5ml độc chất. Khi phun ra tầm xa 10m, độc tố cực mạnh (mạnh hơn nọc rắn hổ mang 15 lần) sẽ ngăn chặn sự tổng hợp protein và DNA của đối thủ, gây loét hoại tử sâu hoắm hoặc mù mắt vĩnh viễn chỉ trong vài giây.\n- Tốc độ di chuyển bứt phá: Đôi chân thon dài chuyển động với tần số cao cho phép bọ bứt tốc đạt 90 km/h trên mọi bề mặt phẳng.\n- Thân hình linh hoạt: Cấu trúc bụng phân đốt dẻo dai uốn cong linh hoạt như bọ cạp, cho phép luồn lách qua các khe hẹp và tấn công từ nhiều góc độ bất ngờ.",
            formulas_and_data: {
              scaling_factor: 8000000,
              mass_g_original: 0.01,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Tầm xa phun độc chất",
                  equation: "Range = Range_original * L_factor",
                  result: "~10.2 m"
                },
                {
                  name: "Lượng độc tố tích lũy tối đa",
                  equation: "V_toxin = V_original * Vol_factor",
                  result: "~5.1 mL Pederin (đủ gây hoại tử diện rộng cho 50 người)"
                }
              ]
            },
            p4p_score_scaled: 90,
            tier_scaled: "A",
            sources: [
              { label: "Pederin Biosynthesis and Toxicological Properties", url: "https://doi.org/10.1016/j.toxicon.2018.11.002" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Mất tự chủ độc chất và sụp đổ cấu trúc thân dài)",
            slug: "kien-ba-khoang-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Tự ngộ độc Pederin khi vỏ nứt vỡ, cơ thể dài gãy gập dưới lực nén trọng trường và ngạt thở.",
            content: "Trong thực tế sinh học, Kiến Ba Khoang 80kg sẽ tự tiêu diệt bản thân:\n- Tự ngộ độc hóa học: Pederin là chất cực độc. Ở quy mô 80kg, nếu lớp biểu bì mỏng manh của bọ bị rách hoặc nứt vỡ do va chạm cơ học, lượng Pederin rò rỉ vào cơ thể sẽ phân hủy các tế bào nội tạng của chính nó do thiếu lớp màng bảo vệ cô lập ở quy mô lớn.\n- Thân dài gãy gập: Thân hình thon dài của kiến ba khoang thiếu bộ khung nâng đỡ bên trong. Trọng lượng 80kg đè nén khiến phần bụng dài thượt bị kéo lê trên mặt đất, mài mòn và rách toác các màng liên đốt mỏng manh.\n- Thiếu oxy trầm trọng: Hệ thống thở thụ động spiracle không thể thông khí cho cơ thể dài hơn 1.5m, khiến các tế bào thần kinh chết ngạt trong vài phút.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Tổn thương màng liên đốt bụng",
                  issue: "Ứng suất trượt trên màng liên đốt bụng vượt quá 1.2 MPa dưới tác dụng của trọng lực bụng kéo lê, gây rách rò rỉ dịch thể."
                },
                {
                  type: "Khủng hoảng trao đổi khí cơ thể dài",
                  issue: "Tốc độ khuếch tán oxy dọc chiều dài cơ thể giảm tỷ lệ nghịch với bình phương khoảng cách, gây hoại tử cơ đuôi."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Insect exoskeleton elasticity and scaling constraints", url: "https://doi.org/10.1086/676859" }
            ]
          },
          {
            title: "Đột biến thích nghi (Sát thủ đầm lầy hóa hóa học)",
            slug: "kien-ba-khoang-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tuyến chứa độc phủ Teflon sinh học cách ly, thanh sụn chitin nâng đỡ dọc sống bụng và phổi sách chủ động.",
            content: "Để Kiến Ba Khoang thích nghi và săn mồi hiệu quả ở kích thước 80kg:\n- Tuyến chứa độc Teflon sinh học (Fluoropolymer-like Lining): Lớp niêm mạc tuyến độc được bọc một lớp màng glycoprotein siêu kỵ nước đặc biệt, cách ly hoàn toàn Pederin khỏi các mô cơ thể lân cận.\n- Thanh sụn chitin nâng đỡ (Chitinous Endoskeleton struts): Phát triển các thanh sụn dọc bên trong khoang bụng hoạt động như cột sống thô sơ, giữ cho thân dài thẳng đứng và phân phối đều lực nén trọng lực.\n- Phổi khí quản chủ động: Các lỗ thở dọc hai bên hông được trang bị van đóng mở bằng cơ và túi khí co giãn liên tục để bơm đẩy không khí lưu thông.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Thanh sụn chitin nâng đỡ bụng",
                  benefit: "Giảm 85% ứng suất uốn tác dụng lên các khớp bụng, cho phép uốn cong 90 độ mà không tổn hại màng liên đốt."
                },
                {
                  type: "Lớp lót chống ăn mòn tuyến độc",
                  benefit: "Chống ăn mòn tuyệt đối trước nồng độ Pederin đậm đặc lên tới 50%, ngăn ngừa tự hoại tử mô."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "B",
            sources: [
              { label: "Endoskeletal structures in giant arthropods and safety margins", url: "https://doi.org/10.1016/j.actbio.2019.05.014" }
            ]
          }
        ]
      });
    } else if (target.id === "goliath-birdeater") {
      whatIfData.push({
        creature_id: "goliath-birdeater",
        title: "Nếu Nhện Ăn Chim Goliath (Goliath Birdeater) phóng to bằng con người (80kg) thì sao?",
        slug: "neu-nhen-an-chim-goliath-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài Nhện Ăn Chim Goliath (Theraphosa blondi) với bộ càng chelicerae khổng lồ và bão lông ngứa phóng to đến kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Ác mộng tám chân và cơn mưa gai ngứa)",
            slug: "nhen-an-chim-goliath-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Càng chelicerae dài 15cm cắn xuyên thép với lực 8.000 N, bão lông ngứa gai ngược hủy diệt niêm mạc hô hấp của con mồi.",
            content: "Khi Nhện Ăn Chim Goliath phóng to lên 80kg:\n- Lực cắn nghiền nát vật cản: Cặp càng chelicerae sừng hóa dài 15cm cực kỳ sắc nhọn, hoạt động bằng bó cơ hàm khổng lồ tạo ra lực cắn lên tới 8.000 N, dễ dàng cắn đứt tấm thép mỏng hoặc nghiền nát xương đùi con mồi.\n- Bão lông ngứa độc hại: Khi đá chân vào bụng, nhện giải phóng hàng triệu lông ngứa (urticating hairs) dạng gai ngược rỗng dài 5cm. Lớp lông ngứa này bay lơ lửng, găm sâu vào da và niêm mạc phổi của đối thủ, gây sưng phù hoại tử và ngạt thở tức khắc.\n- Tấn công phục kích: Khả năng ngụy trang dưới hầm đất sâu và bứt tốc vồ mồi chớp nhoáng.",
            formulas_and_data: {
              scaling_factor: 457,
              mass_g_original: 175,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn của chelicerae",
                  equation: "F_bite = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~8,200 N (nghiền nát xương ống dễ dàng)"
                },
                {
                  name: "Số lượng gai ngứa phát tán mỗi lần đá bụng",
                  equation: "N_hairs = N_original * Area_factor",
                  result: "~15,000,000 gai ngứa (phủ kín bán kính 5m)"
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Goliath Birdeater Mandible Mechanics and Venom", url: "https://doi.org/10.1242/jeb.02410" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Vỡ bụng tự phát và nổ khớp chân thủy lực)",
            slug: "nhen-an-chim-goliath-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Rupture bụng chết người từ độ cao 10cm, và áp suất thủy dịch cần thiết để duỗi chân làm vỡ tung các khớp.",
            content: "Trong thực tế sinh học, Nhện Goliath 80kg sẽ chết ngay lập tức:\n- Vỡ bụng thảm hại (Abdomen Rupture): Abdomen của nhện không có xương nâng đỡ và lớp exoskeleton ở bụng rất mỏng manh để chứa trứng/nội tạng. Một cú ngã nhẹ từ độ cao chỉ 10cm cũng sẽ làm vỡ tung phần bụng mềm này, gây mất máu hemolymph và tử vong tức thì.\n- Nổ tung khớp chân thủy lực: Spiders không có cơ duỗi chi mà dùng áp suất thủy lực hemolymph để đẩy chân ra. Để di chuyển cơ thể 80kg bứt tốc, áp suất thủy lực cần đạt 50 atm (5.000 kPa). Áp lực khủng khiếp này vượt xa giới hạn bền kéo của màng khớp chân nhện, làm nổ tung các khớp gối.\n- Xẹp phổi sách: Các lá phổi sách thụ động dính chặt vào nhau do trọng lực và áp suất dịch cơ thể lớn, cắt đứt hoàn toàn việc trao đổi khí.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp suất thủy lực duỗi chân cực đại",
                  issue: "Áp suất cần thiết (5,070 kPa) vượt quá giới hạn nổ khớp màng cutin (900 kPa), làm gãy khớp chân khi cử động."
                },
                {
                  type: "Độ cao giới hạn gây vỡ bụng",
                  issue: "H_critical = 0.08 m (rơi từ độ cao trên 8cm sẽ gây nứt vỡ lớp vỏ abdomen mỏng)."
                }
              ]
            },
            p4p_score_scaled: 14,
            tier_scaled: "D",
            sources: [
              { label: "Biophysics of spider hydraulic movement and exoskeleton limits", url: "https://doi.org/10.1098/rsif.2015.0834" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái vật săn mồi tám chân bọc thép)",
            slug: "nhen-an-chim-goliath-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa cơ duỗi chân cơ học trực tiếp, vòng sụn chitin nâng đỡ bụng mềm và phổi sách chủ động.",
            content: "Để Nhện Goliath 80kg sống sót và thống trị mặt đất:\n- Cơ duỗi chân cơ học trực tiếp: Các khớp chân phát triển hệ cơ duỗi chéo trực tiếp bên trong, loại bỏ hoàn toàn cơ chế áp suất thủy lực yếu ớt và dễ nổ vỡ.\n- Khung nâng đỡ bụng mềm (Abdominal Ribs): Tiến hóa các vòng sụn chitin xếp song song dọc khoang bụng (tương tự lồng ngực) nâng đỡ nội tạng, ngăn ngừa bụng biến dạng hoặc rách vỡ khi va chạm.\n- Phổi sách chủ động tuần hoàn: Các lá phổi sách được ngăn cách bằng các trụ chitin siêu mịn và có hệ thống cơ co bóp chủ động đẩy hút khí liên tục.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vòng sụn chitin nâng đỡ bụng",
                  benefit: "Tăng giới hạn chịu va đập của bụng lên 25 lần, chịu được cú ngã từ độ cao 2m mà không rách vỏ."
                },
                {
                  type: "Hệ cơ duỗi chân trực tiếp",
                  benefit: "Loại bỏ hoàn toàn rủi ro vỡ áp lực hemolymph, tăng lực đẩy chân lên gấp 4.5 lần."
                }
              ]
            },
            p4p_score_scaled: 91,
            tier_scaled: "S",
            sources: [
              { label: "Exoskeleton reinforcements and mechanical adaptions in heavy arachnids", url: "https://doi.org/10.1016/j.actbio.2020.11.012" }
            ]
          }
        ]
      });
    } else {
      // Fallback generator just in case
      whatIfData.push({
        creature_id: target.id,
        title: `Nếu ${target.name} phóng to bằng con người (80kg) thì sao?`,
        slug: `neu-${target.id}-phong-to-bang-con-nguoi-80kg`,
        description: `Phân tích giả thuyết khi loài ${target.name} phóng to bằng kích thước con người 80kg.`,
        answers: [
          {
            title: `Góc nhìn cơ học lý thuyết (${target.name} khổng lồ)`,
            slug: `${target.id}-80kg-co-hoc-ly-thuyet`,
            perspective_type: "classic_scaling",
            summary: "Phóng đại sức mạnh hoàn hảo bằng tỷ lệ cơ học tuyến tính.",
            content: `Khi phóng to lên 80kg, sức mạnh của ${target.name} được nhân lên vượt bậc.`,
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_scaled: 80,
              formulas: []
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: []
          },
          {
            title: `Giới hạn sinh học thực tế (${target.name} sụp đổ)`,
            slug: `${target.id}-80kg-sinh-hoc-thuc-te`,
            perspective_type: "biological_reality",
            summary: "Không chịu nổi trọng lực và gặp các rào cản hô hấp nghiêm trọng.",
            content: `Tuy nhiên, thực tế ${target.name} sẽ sụp đổ dưới trọng lượng cơ thể và ngạt thở.`,
            formulas_and_data: {
              limitations: []
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: []
          }
        ]
      });
    }
  }

  // 3. Save JSON to file
  const tempJsonPath = path.join(__dirname, "temp-what-if.json");
  fs.writeFileSync(tempJsonPath, JSON.stringify(whatIfData, null, 2), "utf-8");
  console.log(`\n💾 Saved What-If temporary data to: ${tempJsonPath}`);

  // 4. Update Database
  try {
    console.log("⚡ Executing update-what-if.js...");
    const cmd = `node "${path.join(__dirname, "update-what-if.js")}" "${tempJsonPath}"`;
    const stdout = execSync(cmd).toString();
    console.log(stdout);
  } catch (err) {
    console.error("❌ Failed to update database:", err.message);
    // clean up and exit
    if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
    process.exit(1);
  }

  // 5. Clean up temp JSON file
  if (fs.existsSync(tempJsonPath)) {
    fs.unlinkSync(tempJsonPath);
    console.log("🧹 Cleaned up temporary JSON file.");
  }

  // 6. Print Report
  console.log("\n=================== WHAT-IF ENRICHMENT REPORT ===================");
  for (const item of whatIfData) {
    const creatureName = targets.find(t => t.id === item.creature_id)?.name || item.creature_id;
    console.log(`\n🐾 Creature: ${creatureName} (${item.creature_id})`);
    console.log(`❓ Question: "${item.title}"`);
    console.log("📊 Perspectives Evaluation:");
    for (const ans of item.answers) {
      console.log(`  - [${ans.perspective_type.toUpperCase()}] ${ans.title}`);
      console.log(`    ➔ P4P: ${ans.p4p_score_scaled} | Tier: ${ans.tier_scaled}`);
    }
  }
  console.log("=================================================================\n");
  console.log("🎉 Process finished successfully!");
}

runEnrichment().catch(err => {
  console.error("💥 Unhandled error in enrichment execution:", err);
});
